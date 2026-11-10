using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Api.DTOs;
using SchoolAdmission.Api.Services;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("classes")]
public class ClassesController : ControllerBase
{
    private readonly IAdmissionService _admissionService;

    public ClassesController(IAdmissionService admissionService)
    {
        _admissionService = admissionService;
    }

    /// <summary>
    /// 1. POST /classes - Create a new class
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateClass([FromBody] CreateClassRequest request)
    {
        if (!ModelState.IsValid)
        {
            var firstError = ModelState.Values.SelectMany(v => v.Errors).FirstOrDefault()?.ErrorMessage;
            return BadRequest(new ErrorResponse { Message = firstError ?? "ভুল ইনপুট প্রদান করা হয়েছে।", StatusCode = 400 });
        }

        var result = await _admissionService.CreateClassAsync(request);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    /// <summary>
    /// 2. GET /classes - List all classes with seat statistics
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetClasses()
    {
        var classes = await _admissionService.GetClassesAsync();
        return Ok(classes);
    }

    /// <summary>
    /// 3. GET /classes/{classId} - Get details of a single class
    /// </summary>
    [HttpGet("{classId}")]
    public async Task<IActionResult> GetClassById(string classId)
    {
        var result = await _admissionService.GetClassByIdAsync(classId);
        if (result == null)
        {
            return NotFound(new ErrorResponse
            {
                Message = $"ক্লাস আইডি '{classId}' পাওয়া যায়নি।",
                StatusCode = 404
            });
        }
        return Ok(result);
    }

    /// <summary>
    /// 4. POST /classes/{classId}/holds - Apply for admission (seat hold)
    /// </summary>
    [HttpPost("{classId}/holds")]
    public async Task<IActionResult> CreateHold(
        string classId,
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

        var result = await _admissionService.CreateHoldAsync(classId, studentId);
        return StatusCode(StatusCodes.Status201Created, result);
    }
}
