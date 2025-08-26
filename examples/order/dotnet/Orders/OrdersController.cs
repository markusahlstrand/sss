using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrdersService.Common;
using System.ComponentModel.DataAnnotations;
using ValidationException = OrdersService.Common.ValidationException;

namespace OrdersService.Orders;

[ApiController]
[Route("orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrdersService _ordersService;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(IOrdersService ordersService, ILogger<OrdersController> logger)
    {
        _ordersService = ordersService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new order
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "orders.write")]
    [ProducesResponseType(typeof(Order), 201)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    public async Task<ActionResult<Order>> CreateOrder([FromBody] OrderCreate orderCreate)
    {
        if (!ModelState.IsValid)
        {
            var validationErrors = ModelState
                .SelectMany(x => x.Value!.Errors)
                .Select(x => x.ErrorMessage)
                .ToList();

            throw new ValidationException(string.Join(", ", validationErrors));
        }

        var order = await _ordersService.CreateOrderAsync(orderCreate);
        return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
    }

    /// <summary>
    /// Get an order by ID
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Policy = "orders.read")]
    [ProducesResponseType(typeof(Order), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    public async Task<ActionResult<Order>> GetOrder([Required] string id)
    {
        var order = await _ordersService.GetOrderAsync(id);
        if (order == null)
        {
            throw new NotFoundException($"Order with id '{id}' not found");
        }

        return Ok(order);
    }

    /// <summary>
    /// Update an order's status
    /// </summary>
    [HttpPatch("{id}")]
    [Authorize(Policy = "orders.write")]
    [ProducesResponseType(typeof(Order), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    public async Task<ActionResult<Order>> UpdateOrder([Required] string id, [FromBody] OrderUpdate orderUpdate)
    {
        if (!ModelState.IsValid)
        {
            var validationErrors = ModelState
                .SelectMany(x => x.Value!.Errors)
                .Select(x => x.ErrorMessage)
                .ToList();

            throw new ValidationException(string.Join(", ", validationErrors));
        }

        var order = await _ordersService.UpdateOrderAsync(id, orderUpdate);
        if (order == null)
        {
            throw new NotFoundException($"Order with id '{id}' not found");
        }

        return Ok(order);
    }

    /// <summary>
    /// List orders with pagination
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "orders.read")]
    [ProducesResponseType(typeof(List<Order>), 200)]
    public async Task<ActionResult<List<Order>>> GetOrders(
        [FromQuery] int limit = 10,
        [FromQuery] int offset = 0)
    {
        if (limit <= 0 || limit > 100)
        {
            throw new ValidationException("Limit must be between 1 and 100");
        }

        if (offset < 0)
        {
            throw new ValidationException("Offset must be non-negative");
        }

        var orders = await _ordersService.GetOrdersAsync(limit, offset);
        return Ok(orders);
    }
}
