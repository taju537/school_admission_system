using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.DTOs;
using SchoolAdmission.Api.Models;

namespace SchoolAdmission.Api.Services;

public class AdmissionService : IAdmissionService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AdmissionService> _logger;
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> ClassSemaphores = new();

    public AdmissionService(
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<AdmissionService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    private int HoldDurationSeconds => _configuration.GetValue<int>("HOLD_DURATION_SECONDS", 600);

    private static void ValidateStudentId(string studentId)
    {
        if (string.IsNullOrWhiteSpace(studentId) || !Regex.IsMatch(studentId.Trim(), @"^\d{17}$"))
        {
            throw new BadRequestException("শিক্ষার্থীর জন্ম নিবন্ধন নম্বর অবশ্যই ১৭ অঙ্কের সংখ্যা হতে হবে (Student ID must be 17 digits).");
        }
    }

    private SemaphoreSlim GetClassSemaphore(string classId)
    {
        return ClassSemaphores.GetOrAdd(classId, _ => new SemaphoreSlim(1, 1));
    }

    public async Task<CreateClassResponse> CreateClassAsync(CreateClassRequest request)
    {
        var cleanName = request.Name.Trim();
        var id = $"c_{Guid.NewGuid():N}"[..7];

        var schoolClass = new SchoolClass
        {
            Id = id,
            Name = cleanName,
            TotalSeats = request.TotalSeats,
            ConfirmedSeats = 0,
            CreatedAt = DateTime.UtcNow
        };

        _context.Classes.Add(schoolClass);
        await _context.SaveChangesAsync();

        return new CreateClassResponse
        {
            Id = schoolClass.Id,
            Name = schoolClass.Name,
            TotalSeats = schoolClass.TotalSeats
        };
    }

    public async Task<List<ClassResponse>> GetClassesAsync()
    {
        var now = DateTime.UtcNow;

        var classes = await _context.Classes
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        // Calculate dynamic non-expired holds for each class
        var activeHeldCounts = await _context.Holds
            .Where(h => h.Status == HoldStatus.HELD && h.ExpiresAt > now)
            .GroupBy(h => h.ClassId)
            .Select(g => new { ClassId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ClassId, x => x.Count);

        return classes.Select(c =>
        {
            var held = activeHeldCounts.GetValueOrDefault(c.Id, 0);
            var available = Math.Max(0, c.TotalSeats - c.ConfirmedSeats - held);

            return new ClassResponse
            {
                Id = c.Id,
                Name = c.Name,
                TotalSeats = c.TotalSeats,
                HeldSeats = held,
                ConfirmedSeats = c.ConfirmedSeats,
                AvailableSeats = available
            };
        }).ToList();
    }

    public async Task<ClassResponse?> GetClassByIdAsync(string classId)
    {
        var schoolClass = await _context.Classes.FirstOrDefaultAsync(c => c.Id == classId);
        if (schoolClass == null) return null;

        var now = DateTime.UtcNow;
        var held = await _context.Holds.CountAsync(h =>
            h.ClassId == classId &&
            h.Status == HoldStatus.HELD &&
            h.ExpiresAt > now);

        var available = Math.Max(0, schoolClass.TotalSeats - schoolClass.ConfirmedSeats - held);

        return new ClassResponse
        {
            Id = schoolClass.Id,
            Name = schoolClass.Name,
            TotalSeats = schoolClass.TotalSeats,
            HeldSeats = held,
            ConfirmedSeats = schoolClass.ConfirmedSeats,
            AvailableSeats = available
        };
    }

    public async Task<HoldResponse> CreateHoldAsync(string classId, string studentId)
    {
        ValidateStudentId(studentId);
        studentId = studentId.Trim();

        // In-memory semaphore for local locking (defense-in-depth)
        var semaphore = GetClassSemaphore(classId);
        await semaphore.WaitAsync();

        try
        {
            // If relational database (PostgreSQL), open transaction with row lock (SELECT FOR UPDATE)
            if (_context.Database.IsRelational())
            {
                using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted);
                try
                {
                    // Row lock on Classes row prevents race conditions across multiple instances (Bonus §1.6)
                    await _context.Database.ExecuteSqlRawAsync(
                        "SELECT \"Id\" FROM \"Classes\" WHERE \"Id\" = {0} FOR UPDATE", classId);

                    return await ExecuteHoldCreationInsideLockAsync(classId, studentId, transaction);
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            else
            {
                // In-Memory provider (for unit tests)
                return await ExecuteHoldCreationInsideLockAsync(classId, studentId, null);
            }
        }
        finally
        {
            semaphore.Release();
        }
    }

    private async Task<HoldResponse> ExecuteHoldCreationInsideLockAsync(
        string classId,
        string studentId,
        Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? transaction)
    {
        var schoolClass = await _context.Classes.FirstOrDefaultAsync(c => c.Id == classId);
        if (schoolClass == null)
        {
            throw new NotFoundException($"ক্লাস আইডি '{classId}' পাওয়া যায়নি।");
        }

        var now = DateTime.UtcNow;

        // Rule 3: Check if student already has active hold or confirmed admission in this class
        var existingActive = await _context.Holds.AnyAsync(h =>
            h.ClassId == classId &&
            h.StudentId == studentId &&
            (h.Status == HoldStatus.CONFIRMED || (h.Status == HoldStatus.HELD && h.ExpiresAt > now)));

        if (existingActive)
        {
            throw new ConflictException("এই ক্লাসে শিক্ষার্থীর ইতিমধ্যে একটি সক্রিয় আবেদন বা নিশ্চিত ভর্তি রয়েছে।");
        }

        // Rule 1 & Dynamic Expiry: Calculate non-expired held seats
        var activeHeldSeats = await _context.Holds.CountAsync(h =>
            h.ClassId == classId &&
            h.Status == HoldStatus.HELD &&
            h.ExpiresAt > now);

        if (schoolClass.ConfirmedSeats + activeHeldSeats >= schoolClass.TotalSeats)
        {
            throw new ConflictException("দুঃখিত, এই ক্লাসে আর কোনো আসন খালি নেই।");
        }

        var holdId = $"h_{Guid.NewGuid():N}"[..7];
        var expiresAt = now.AddSeconds(HoldDurationSeconds);

        var newHold = new Hold
        {
            HoldId = holdId,
            ClassId = classId,
            StudentId = studentId,
            Status = HoldStatus.HELD,
            CreatedAt = now,
            ExpiresAt = expiresAt
        };

        _context.Holds.Add(newHold);
        await _context.SaveChangesAsync();

        if (transaction != null)
        {
            await transaction.CommitAsync();
        }

        return new HoldResponse
        {
            HoldId = newHold.HoldId,
            ClassId = newHold.ClassId,
            StudentId = newHold.StudentId,
            Status = "HELD",
            ExpiresAt = newHold.ExpiresAt
        };
    }

    public async Task<HoldDetailResponse?> GetHoldAsync(string holdId)
    {
        var hold = await _context.Holds.FirstOrDefaultAsync(h => h.HoldId == holdId);
        if (hold == null) return null;

        var now = DateTime.UtcNow;
        var statusStr = hold.Status.ToString();

        // Dynamic expiration check (§1.5 Rule 2)
        if (hold.Status == HoldStatus.HELD && hold.ExpiresAt <= now)
        {
            statusStr = "EXPIRED";
        }

        return new HoldDetailResponse
        {
            HoldId = hold.HoldId,
            ClassId = hold.ClassId,
            Status = statusStr,
            ExpiresAt = hold.ExpiresAt
        };
    }

    public async Task<ConfirmHoldResponse> ConfirmHoldAsync(string holdId, string studentId)
    {
        ValidateStudentId(studentId);
        studentId = studentId.Trim();

        var hold = await _context.Holds
            .Include(h => h.Class)
            .FirstOrDefaultAsync(h => h.HoldId == holdId);

        if (hold == null)
        {
            throw new NotFoundException($"আবেদন আইডি '{holdId}' পাওয়া যায়নি।");
        }

        // Rule 4: Only student's own hold can be confirmed
        if (hold.StudentId != studentId)
        {
            throw new ForbiddenException("শুধুমাত্র নিজের আবেদন নিশ্চিত করা যাবে।");
        }

        // Rule 5: Idempotency - if already CONFIRMED, return 200 without double counting
        if (hold.Status == HoldStatus.CONFIRMED)
        {
            return new ConfirmHoldResponse
            {
                HoldId = hold.HoldId,
                Status = "CONFIRMED"
            };
        }

        var now = DateTime.UtcNow;

        // Check if status is HELD and not expired
        if (hold.Status != HoldStatus.HELD || hold.ExpiresAt <= now)
        {
            if (hold.Status == HoldStatus.HELD)
            {
                hold.Status = HoldStatus.EXPIRED;
                await _context.SaveChangesAsync();
            }
            throw new BadRequestException("আবেদনের মেয়াদ শেষ হয়ে গেছে অথবা আবেদনটি আর সক্রিয় নেই।");
        }

        // Apply confirmation in transaction
        if (_context.Database.IsRelational())
        {
            using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted);
            try
            {
                await _context.Database.ExecuteSqlRawAsync(
                    "SELECT \"Id\" FROM \"Classes\" WHERE \"Id\" = {0} FOR UPDATE", hold.ClassId);

                hold.Status = HoldStatus.CONFIRMED;
                hold.ConfirmedAt = now;
                if (hold.Class != null)
                {
                    hold.Class.ConfirmedSeats += 1;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        else
        {
            hold.Status = HoldStatus.CONFIRMED;
            hold.ConfirmedAt = now;
            if (hold.Class != null)
            {
                hold.Class.ConfirmedSeats += 1;
            }
            await _context.SaveChangesAsync();
        }

        return new ConfirmHoldResponse
        {
            HoldId = hold.HoldId,
            Status = "CONFIRMED"
        };
    }

    public async Task CancelHoldAsync(string holdId, string studentId)
    {
        ValidateStudentId(studentId);
        studentId = studentId.Trim();

        var hold = await _context.Holds.FirstOrDefaultAsync(h => h.HoldId == holdId);
        if (hold == null)
        {
            throw new NotFoundException($"আবেদন আইডি '{holdId}' পাওয়া যায়নি।");
        }

        if (hold.StudentId != studentId)
        {
            throw new ForbiddenException("শুধুমাত্র নিজের আবেদন বাতিল করা যাবে।");
        }

        if (hold.Status == HoldStatus.HELD)
        {
            hold.Status = HoldStatus.CANCELLED;
            hold.CancelledAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<StudentHoldResponse>> GetMyHoldsAsync(string studentId)
    {
        ValidateStudentId(studentId);
        studentId = studentId.Trim();

        var now = DateTime.UtcNow;

        var holds = await _context.Holds
            .Include(h => h.Class)
            .Where(h => h.StudentId == studentId)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();

        return holds.Select(h =>
        {
            var statusStr = h.Status.ToString();
            if (h.Status == HoldStatus.HELD && h.ExpiresAt <= now)
            {
                statusStr = "EXPIRED";
            }

            return new StudentHoldResponse
            {
                HoldId = h.HoldId,
                ClassId = h.ClassId,
                ClassName = h.Class?.Name ?? $"Class {h.ClassId}",
                Status = statusStr,
                ExpiresAt = h.ExpiresAt
            };
        }).ToList();
    }

    public async Task CleanupExpiredHoldsAsync()
    {
        var now = DateTime.UtcNow;
        var expiredHolds = await _context.Holds
            .Where(h => h.Status == HoldStatus.HELD && h.ExpiresAt <= now)
            .ToListAsync();

        if (expiredHolds.Count > 0)
        {
            foreach (var hold in expiredHolds)
            {
                hold.Status = HoldStatus.EXPIRED;
            }
            await _context.SaveChangesAsync();
            _logger.LogInformation("Cleaned up {Count} expired holds.", expiredHolds.Count);
        }
    }
}

