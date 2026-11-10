using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.Middleware;
using SchoolAdmission.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure Port (Listen on 8080 as required by §1.2 & §1.4)
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(8080);
});

// 2. Add Services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.Never;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "School Admission System API",
        Version = "v1",
        Description = "Take-home Assignment API for School Admission System (Onnorokom Projukti Limited)"
    });
});

// 3. Database Configuration (PostgreSQL with configurable connection string)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");

if (!string.IsNullOrWhiteSpace(connectionString))
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseNpgsql(connectionString, npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(5),
                errorCodesToAdd: null);
        }));
}
else
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseInMemoryDatabase("SchoolAdmissionDb"));
}

// 4. Register Application Services & Background Worker
builder.Services.AddScoped<IAdmissionService, AdmissionService>();
builder.Services.AddHostedService<HoldExpirationBackgroundService>();

// 5. Configure CORS (Permit frontend communication with X-Student-Id)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader()
              .WithExposedHeaders("X-Student-Id");
    });
});

var app = builder.Build();

// 6. Database Initialization & Seeding on Startup
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    await DbInitializer.InitializeAsync(context, logger);
}

// 7. Configure Pipeline
app.UseCors("AllowAll");

app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "School Admission System API v1");
    c.RoutePrefix = "swagger";
});

app.UseAuthorization();

app.MapControllers();

app.Run();

