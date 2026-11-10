namespace SchoolAdmission.Api.Services;

public class HoldExpirationBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<HoldExpirationBackgroundService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(5);

    public HoldExpirationBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<HoldExpirationBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("HoldExpirationBackgroundService is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var admissionService = scope.ServiceProvider.GetRequiredService<IAdmissionService>();
                await admissionService.CleanupExpiredHoldsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during expired holds cleanup.");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("HoldExpirationBackgroundService is stopping.");
    }
}
