using Serilog;
using System.Text.Json;

namespace OrdersService.Events;

public interface IEventService
{
    Task PublishAsync(string eventType, object data);
}

public class EventService : IEventService
{
    private readonly ILogger<EventService> _logger;

    public EventService(ILogger<EventService> logger)
    {
        _logger = logger;
    }

    public async Task PublishAsync(string eventType, object data)
    {
        try
        {
            // Create CloudEvent-compatible structure
            var cloudEvent = new
            {
                specversion = "1.0",
                type = eventType,
                source = "https://orders-service/events",
                id = Guid.NewGuid().ToString(),
                time = DateTimeOffset.UtcNow.ToString("O"),
                datacontenttype = "application/json",
                subject = eventType,
                data = data
            };

            // Serialize to JSON
            var json = JsonSerializer.Serialize(cloudEvent, new JsonSerializerOptions 
            { 
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
            });

            // In development, we log the event
            // In production, this would publish to a message broker (Azure Service Bus, RabbitMQ, etc.)
            _logger.LogInformation("Event published: {EventType} - {Event}", eventType, json);
            
            // Simulate async processing
            await Task.Delay(10);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish event {EventType}", eventType);
            throw;
        }
    }
}
