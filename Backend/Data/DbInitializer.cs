using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Models;

namespace SchoolAdmission.Api.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(ApplicationDbContext context, ILogger logger)
    {
        var maxRetries = 10;
        var retryDelay = TimeSpan.FromSeconds(3);

        for (int retry = 1; retry <= maxRetries; retry++)
        {
            try
            {
                logger.LogInformation("Attempting to connect and initialize database (Attempt {Attempt}/{MaxRetries})...", retry, maxRetries);

                if (context.Database.IsRelational())
                {
                    // Create tables if they don't exist
                    await context.Database.EnsureCreatedAsync();
                }
                else
                {
                    await context.Database.EnsureCreatedAsync();
                }

                // Seed sample classes if empty
                if (!await context.Classes.AnyAsync())
                {
                    logger.LogInformation("Seeding initial classes into database...");

                    var seedClasses = new List<SchoolClass>
                    {
                        new()
                        {
                            Id = "c_101",
                            Name = "Class 6 - Morning Shift",
                            TotalSeats = 120,
                            ConfirmedSeats = 0,
                            CreatedAt = DateTime.UtcNow
                        },
                        new()
                        {
                            Id = "c_102",
                            Name = "Class 6 - Day Shift",
                            TotalSeats = 120,
                            ConfirmedSeats = 0,
                            CreatedAt = DateTime.UtcNow
                        },
                        new()
                        {
                            Id = "c_103",
                            Name = "Class 7 - Morning Shift",
                            TotalSeats = 90,
                            ConfirmedSeats = 0,
                            CreatedAt = DateTime.UtcNow
                        },
                        new()
                        {
                            Id = "c_104",
                            Name = "Class 7 - Day Shift",
                            TotalSeats = 90,
                            ConfirmedSeats = 0,
                            CreatedAt = DateTime.UtcNow
                        }
                    };

                    await context.Classes.AddRangeAsync(seedClasses);
                    await context.SaveChangesAsync();
                    logger.LogInformation("Database seeded successfully with {Count} classes.", seedClasses.Count);
                }

                logger.LogInformation("Database initialization completed successfully.");
                return;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Database connection attempt {Attempt} failed. Retrying in {Seconds}s...", retry, retryDelay.TotalSeconds);
                if (retry == maxRetries)
                {
                    logger.LogError(ex, "Failed to connect to database after {MaxRetries} attempts.", maxRetries);
                    throw;
                }
                await Task.Delay(retryDelay);
            }
        }
    }
}
