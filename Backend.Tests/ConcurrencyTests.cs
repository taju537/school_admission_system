using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.DTOs;
using SchoolAdmission.Api.Services;
using Xunit;

namespace SchoolAdmission.Tests;

public class ConcurrencyTests
{
    private (AdmissionService service, ApplicationDbContext context) CreateService(string dbName)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var context = new ApplicationDbContext(options);
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "HOLD_DURATION_SECONDS", "600" }
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        var service = new AdmissionService(context, configuration, NullLogger<AdmissionService>.Instance);
        return (service, context);
    }

    /// <summary>
    /// Concurrency Test (§1.7):
    /// Simulates many concurrent requests attempting to hold seats simultaneously
    /// and demonstrates that held seats NEVER exceed totalSeats.
    /// </summary>
    [Fact]
    public async Task ConcurrentHolds_NeverExceedTotalSeats()
    {
        var (service, context) = CreateService(nameof(ConcurrentHolds_NeverExceedTotalSeats));

        // Create a class with strictly 5 seats
        const int totalSeats = 5;
        var cls = await service.CreateClassAsync(new CreateClassRequest
        {
            Name = "Class 6 - Morning High Demand",
            TotalSeats = totalSeats
        });

        // 30 distinct applicants competing simultaneously
        const int totalApplicants = 30;
        var successes = new ConcurrentBag<HoldResponse>();
        var conflicts = new ConcurrentBag<ConflictException>();
        var otherErrors = new ConcurrentBag<Exception>();

        var tasks = Enumerable.Range(1, totalApplicants).Select(async i =>
        {
            // 17-digit student IDs: 20150000000000001, 20150000000000002, etc.
            var studentId = $"2015000000000{i:D4}";
            try
            {
                var hold = await service.CreateHoldAsync(cls.Id, studentId);
                successes.Add(hold);
            }
            catch (ConflictException cex)
            {
                conflicts.Add(cex);
            }
            catch (Exception ex)
            {
                otherErrors.Add(ex);
            }
        });

        // Execute all requests concurrently
        await Task.WhenAll(tasks);

        // Verification assertions
        Assert.Empty(otherErrors);
        Assert.Equal(totalSeats, successes.Count); // Exactly 5 succeed
        Assert.Equal(totalApplicants - totalSeats, conflicts.Count); // Exactly 25 rejected with Conflict 409

        // Verify class seat count from API
        var finalClassState = await service.GetClassByIdAsync(cls.Id);
        Assert.NotNull(finalClassState);
        Assert.Equal(totalSeats, finalClassState.TotalSeats);
        Assert.Equal(totalSeats, finalClassState.HeldSeats);
        Assert.Equal(0, finalClassState.AvailableSeats);
        Assert.True(finalClassState.HeldSeats + finalClassState.ConfirmedSeats <= finalClassState.TotalSeats,
            "Held + Confirmed seats must NEVER exceed TotalSeats!");
    }
}

