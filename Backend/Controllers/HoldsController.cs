using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Api.DTOs;
using SchoolAdmission.Api.Services;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("holds")]
public class HoldsController : ControllerBase
{
    private readonly IAdmissionService _admissionService;

    public HoldsController(IAdmissionService admissionService)
    {
        _admissionService = admissionService;
    }

    /// <summary>
    /// 5. GET /holds/{holdId} - Get current status of an application hold
    /// </summary>
    [HttpGet("{holdId}")]
    public async Task<IActionResult> GetHold(string holdId)
    {
        var result = await _admissionService.GetHoldAsync(holdId);
        if (result == null)
        {
            return NotFound(new ErrorResponse
            {
                Message = $"আবেদন আইডি '{holdId}' পাওয়া যায়নি।",
                StatusCode = 404
            });
        }
        return Ok(result);
    }

    /// <summary>
    /// 6. POST /holds/{holdId}/confirm - Confirm admission & payment
    /// </summary>
    [HttpPost("{holdId}/confirm")]
    public async Task<IActionResult> ConfirmHold(
        string holdId,
        [FromHeader(Name = "X-Student-Id")] string? studentId)
    {
        if (string.IsNullOrWhiteSpace(studentId))
        {
            return BadRequest(new ErrorResponse
            {
                Message = "X-Student-Id হেডার অবশ্যই প্রদান করতে হবে।",
                StatusCode = 400
            });
        }

        var result = await _admissionService.ConfirmHoldAsync(holdId, studentId);
        return Ok(result);
    }

    /// <summary>
    /// 7. DELETE /holds/{holdId} - Cancel admission hold
    /// </summary>
    [HttpDelete("{holdId}")]
    public async Task<IActionResult> CancelHold(
        string holdId,
        [FromHeader(Name = "X-Student-Id")] string? studentId)
    {
        if (string.IsNullOrWhiteSpace(studentId))
        {
            return BadRequest(new ErrorResponse
            {
                Message = "X-Student-Id হেডার অবশ্যই প্রদান করতে হবে।",
                StatusCode = 400
            });
        }

        await _admissionService.CancelHoldAsync(holdId, studentId);
        return NoContent(); // 204
    }
}

