using Backend.Models;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers
{
    [Authorize] 
    [ApiController]
    [Route("api/[controller]")]

    public class UserController : ControllerBase
    {
        private readonly IMediator _mediator;
        public UserController(IMediator mediator) => _mediator = mediator;

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdValue, out var userId)) return Unauthorized();

            var query = new GetProfileQuery(userId);
            var profile = await _mediator.Send(query);

            if (profile == null) return NotFound("KhÃ´ng tÃ¬m tháº¥y thÃ´ng tin há»“ sÆ¡.");
            
            return Ok(profile);
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdValue, out var userId)) return Unauthorized();

            var command = new UpdateProfileCommand(userId, request.FullName, request.Bio, request.AvatarUrl);
            var success = await _mediator.Send(command);
            
            return success ? Ok("Cáº­p nháº­t thÃ nh cÃ´ng") : BadRequest("Lá»—i khi cáº­p nháº­t");
        }
    }
    public record UpdateProfileRequest(string FullName, string Bio, string AvatarUrl);
}
