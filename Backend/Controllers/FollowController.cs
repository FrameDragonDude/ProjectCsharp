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
    public class FollowController : ControllerBase
    {
        private readonly IMediator _mediator;
        public FollowController(IMediator mediator) => _mediator = mediator;

        [HttpPost("{targetId}")]
        public async Task<IActionResult> ToggleFollow(string targetId, [FromQuery] string type = "User")
        {
            if (type != "User" && type != "Artist") 
            {
                return BadRequest("Loại đối tượng (type) chỉ được phép là 'User' hoặc 'Artist'.");
            }

            var myUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (myUserId == null) return Unauthorized();

            if (type == "User" && myUserId == targetId) 
            {
                return BadRequest("Bạn không thể tự theo dõi chính mình.");
            }

            var command = new ToggleFollowCommand(myUserId, targetId, type);
            var resultMessage = await _mediator.Send(command);
            
            return Ok(resultMessage);
        }
    }
}