using System.ComponentModel.DataAnnotations;

namespace OrdersService.Orders;

public record OrderCreate(
    [Required] string CustomerId,
    [Required, MinLength(1)] List<string> Items
);

public record Order(
    string Id,
    OrderStatus Status,
    string CustomerId,
    List<string> Items,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record OrderUpdate(
    OrderStatus Status
);

public enum OrderStatus
{
    Pending,
    Paid,
    Shipped,
    Delivered
}
