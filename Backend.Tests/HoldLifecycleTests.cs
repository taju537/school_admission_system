using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.DTOs;
using SchoolAdmission.Api.Services;
using Xunit;

namespace SchoolAdmission.Tests;

public class HoldLifecycleTests
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
    public async Task HoldLifecycle_CreateConfirmIdempotent_Success()
    {
        var (service, context) = CreateService(nameof(HoldLifecycle_CreateConfirmIdempotent_Success));

        var cls = await service.CreateClassAsync(new CreateClassRequest
        {
            Name = "Class 7 - Morning Shift",
            TotalSeats = 50
        });

        const string studentId = "20152691234567890";

        // 1. Create Hold
        var hold = await service.CreateHoldAsync(cls.Id, studentId);
        Assert.NotNull(hold.HoldId);
        Assert.Equal("HELD", hold.Status);
        Assert.Equal(cls.Id, hold.ClassId);
        Assert.Equal(studentId, hold.StudentId);

        // Check seat counts
        var classState1 = await service.GetClassByIdAsync(cls.Id);
        Assert.Equal(1, classState1!.HeldSeats);
        Assert.Equal(49, classState1.AvailableSeats);

        // 2. Confirm Hold
        var confirmRes = await service.ConfirmHoldAsync(hold.HoldId, studentId);
        Assert.Equal("CONFIRMED", confirmRes.Status);

        // Check seat counts after confirm
        var classState2 = await service.GetClassByIdAsync(cls.Id);
        Assert.Equal(0, classState2!.HeldSeats);
        Assert.Equal(1, classState2.ConfirmedSeats);
        Assert.Equal(49, classState2.AvailableSeats);

        // 3. Confirm again (Idempotency - §1.5 Rule 5)
        var repeatConfirm = await service.ConfirmHoldAsync(hold.HoldId, studentId);
        Assert.Equal("CONFIRMED", repeatConfirm.Status);

        var classState3 = await service.GetClassByIdAsync(cls.Id);
        Assert.Equal(1, classState3!.ConfirmedSeats); // must still be 1, not 2!
    }

    [Fact]
    public async Task StudentCannotHoldTwiceInSameClass_Rule3()
    {
        var (service, context) = CreateService(nameof(StudentCannotHoldTwiceInSameClass_Rule3));

        var cls = await service.CreateClassAsync(new CreateClassRequest
        {
            Name = "Class 8 - Morning Shift",
            TotalSeats = 50
        });

        const string studentId = "20152691234567890";

        // First hold succeeds
        await service.CreateHoldAsync(cls.Id, studentId);

        // Second hold by same student in same class must throw ConflictException (409)
        await Assert.ThrowsAsync<ConflictException>(async () =>
        {
            await service.CreateHoldAsync(cls.Id, studentId);
        });
    }

    [Fact]
    public async Task CancelHold_ReleasesHeldSeat()
    {
        var (service, context) = CreateService(nameof(CancelHold_ReleasesHeldSeat));

        var cls = await service.CreateClassAsync(new CreateClassRequest
        {
            Name = "Class 9 - Day Shift",
            TotalSeats = 30
        });

        const string studentId = "20152691234567890";

        var hold = await service.CreateHoldAsync(cls.Id, studentId);
        var state1 = await service.GetClassByIdAsync(cls.Id);
        Assert.Equal(1, state1!.HeldSeats);
        Assert.Equal(29, state1.AvailableSeats);

        // Cancel
        await service.CancelHoldAsync(hold.HoldId, studentId);

        var state2 = await service.GetClassByIdAsync(cls.Id);
        Assert.Equal(0, state2!.HeldSeats);
        Assert.Equal(30, state2.AvailableSeats);
    }
}
