using OrdersService.Events;
using Serilog;

namespace OrdersService.Orders;

public interface IOrdersService
{
    Task<Order> CreateOrderAsync(OrderCreate orderCreate);
    Task<Order?> GetOrderAsync(string id);
    Task<Order?> UpdateOrderAsync(string id, OrderUpdate orderUpdate);
    Task<List<Order>> GetOrdersAsync(int limit = 10, int offset = 0);
}

public class OrdersService : IOrdersService
{
    private readonly Dictionary<string, Order> _orders = new();
    private readonly IEventService _eventService;
    private readonly ILogger<OrdersService> _logger;

    public OrdersService(IEventService eventService, ILogger<OrdersService> logger)
    {
        _eventService = eventService;
        _logger = logger;
    }

    public async Task<Order> CreateOrderAsync(OrderCreate orderCreate)
    {
        var order = new Order(
            Id: Guid.NewGuid().ToString(),
            Status: OrderStatus.Pending,
            CustomerId: orderCreate.CustomerId,
            Items: orderCreate.Items,
            CreatedAt: DateTime.UtcNow,
            UpdatedAt: DateTime.UtcNow
        );

        _orders[order.Id] = order;

        _logger.LogInformation("Order created: {OrderId} for customer {CustomerId}", 
            order.Id, order.CustomerId);

        // Publish order.created event
        await _eventService.PublishAsync("order.created", new
        {
            id = order.Id,
            customerId = order.CustomerId,
            items = order.Items,
            status = order.Status.ToString().ToLower()
        });

        return order;
    }

    public Task<Order?> GetOrderAsync(string id)
    {
        _orders.TryGetValue(id, out var order);
        return Task.FromResult(order);
    }

    public async Task<Order?> UpdateOrderAsync(string id, OrderUpdate orderUpdate)
    {
        if (!_orders.TryGetValue(id, out var existingOrder))
        {
            return null;
        }

        var updatedOrder = existingOrder with 
        { 
            Status = orderUpdate.Status,
            UpdatedAt = DateTime.UtcNow
        };

        _orders[id] = updatedOrder;

        _logger.LogInformation("Order updated: {OrderId} status changed to {Status}", 
            id, orderUpdate.Status);

        // Publish order.updated event
        await _eventService.PublishAsync("order.updated", new
        {
            id = updatedOrder.Id,
            status = updatedOrder.Status.ToString().ToLower()
        });

        return updatedOrder;
    }

    public Task<List<Order>> GetOrdersAsync(int limit = 10, int offset = 0)
    {
        var orders = _orders.Values
            .OrderByDescending(o => o.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .ToList();

        return Task.FromResult(orders);
    }
}
