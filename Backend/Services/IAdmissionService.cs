using SchoolAdmission.Api.DTOs;

namespace SchoolAdmission.Api.Services;

public interface IAdmissionService
{
    Task<CreateClassResponse> CreateClassAsync(CreateClassRequest request);
    Task<List<ClassResponse>> GetClassesAsync();
    Task<ClassResponse?> GetClassByIdAsync(string classId);
    Task<HoldResponse> CreateHoldAsync(string classId, string studentId);
    Task<HoldDetailResponse?> GetHoldAsync(string holdId);
    Task<ConfirmHoldResponse> ConfirmHoldAsync(string holdId, string studentId);
    Task CancelHoldAsync(string holdId, string studentId);
    Task<List<StudentHoldResponse>> GetMyHoldsAsync(string studentId);
    Task CleanupExpiredHoldsAsync();
}

