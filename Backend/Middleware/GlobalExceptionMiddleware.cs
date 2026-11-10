using System.Net;
using System.Text.Json;
using SchoolAdmission.Api.DTOs;

namespace SchoolAdmission.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var errorResponse = new ErrorResponse
        {
            Timestamp = DateTime.UtcNow
        };

        switch (exception)
        {
            case BadRequestException badRequest:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                errorResponse.StatusCode = 400;
                errorResponse.Message = badRequest.Message;
                errorResponse.Error = "Bad Request";
                break;

            case NotFoundException notFound:
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                errorResponse.StatusCode = 404;
                errorResponse.Message = notFound.Message;
                errorResponse.Error = "Not Found";
                break;

            case ConflictException conflict:
                context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                errorResponse.StatusCode = 409;
                errorResponse.Message = conflict.Message;
                errorResponse.Error = "Conflict";
                break;

            case ForbiddenException forbidden:
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                errorResponse.StatusCode = 403;
                errorResponse.Message = forbidden.Message;
                errorResponse.Error = "Forbidden";
                break;

            case BadHttpRequestException badHttp:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                errorResponse.StatusCode = 400;
                errorResponse.Message = "ভুল রিকোয়েস্ট ফরম্যাট প্রদান করা হয়েছে।";
                errorResponse.Error = badHttp.Message;
                break;

            default:
                _logger.LogError(exception, "Unhandled server error occurred: {Message}", exception.Message);
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                errorResponse.StatusCode = 500;
                errorResponse.Message = "সার্ভারে একটি অনাকাঙ্ক্ষিত সমস্যা দেখা দিয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।";
                errorResponse.Error = "Internal Server Error";
                break;
        }

        var json = JsonSerializer.Serialize(errorResponse);
        await context.Response.WriteAsync(json);
    }
}
