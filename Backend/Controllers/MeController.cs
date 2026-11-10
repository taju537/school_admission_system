using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Api.DTOs;
using SchoolAdmission.Api.Services;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("me")]
public class MeController : ControllerBase
{
    private readonly IAdmissionService _admissionService;

    public MeController(IAdmissionService admissionService)
    {
        _admissionService = admissionService;
    }

    /// <summary>
    /// 8. GET /me/holds - Get all applications for the student
    /// </summary>
    [HttpGet("holds")]
    public async Task<IActionResult> GetMyHolds([FromHeader(Name = "X-Student-Id")] string? studentId)
    {
        if (string.IsNullOrWhiteSpace(studentId))
        {
            return BadRequest(new ErrorResponse
            {
                Message = "X-Student-Id হেডার অবশ্যই প্রদান করতে হবে।",
                StatusCode = 400
            });
        }

        var results = await _admissionService.GetMyHoldsAsync(studentId);
        return Ok(results);
    }
}

