using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.DTOs;
using SchoolAdmission.Api.Services;
using Xunit;

namespace SchoolAdmission.Tests;

public class ClassApiTests
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

    [Fact]
    public async Task CreateClass_CreatesClass_WithCorrectInitialSeats()
    {
        var (service, context) = CreateService(nameof(CreateClass_CreatesClass_WithCorrectInitialSeats));

        var req = new CreateClassRequest
        {
            Name = "Class 6 - Morning Shift",
            TotalSeats = 120
        };

        var created = await service.CreateClassAsync(req);

        Assert.NotNull(created.Id);
        Assert.StartsWith("c_", created.Id);
        Assert.Equal("Class 6 - Morning Shift", created.Name);
        Assert.Equal(120, created.TotalSeats);

        var details = await service.GetClassByIdAsync(created.Id);
        Assert.NotNull(details);
        Assert.Equal(120, details.TotalSeats);
        Assert.Equal(120, details.AvailableSeats);
        Assert.Equal(0, details.HeldSeats);
        Assert.Equal(0, details.ConfirmedSeats);
    }

    [Fact]
    public async Task GetClasses_ReturnsAllCreatedClasses()
    {
        var (service, context) = CreateService(nameof(GetClasses_ReturnsAllCreatedClasses));

        await service.CreateClassAsync(new CreateClassRequest { Name = "Class 6 - Morning", TotalSeats = 60 });
        await service.CreateClassAsync(new CreateClassRequest { Name = "Class 6 - Day", TotalSeats = 60 });

        var list = await service.GetClassesAsync();

        Assert.Equal(2, list.Count);
        Assert.Contains(list, c => c.Name == "Class 6 - Morning");
        Assert.Contains(list, c => c.Name == "Class 6 - Day");
    }
}

