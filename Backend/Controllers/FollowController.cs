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
        public async Task<IActionResult> ToggleFollow(int targetId, [FromQuery] string type = "User")
        {
            if (type != "User" && type != "Artist") 
            {
                return BadRequest("Loáº¡i Ä‘á»‘i tÆ°á»£ng (type) chá»‰ Ä‘Æ°á»£c phÃ©p lÃ  'User' hoáº·c 'Artist'.");
            }

            var myUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(myUserIdValue, out var myUserId)) return Unauthorized();

            if (type == "User" && myUserId == targetId) 
            {
                return BadRequest("Báº¡n khÃ´ng thá»ƒ tá»± theo dÃµi chÃ­nh mÃ¬nh.");
            }

            var command = new ToggleFollowCommand(myUserId, targetId, type);
            var resultMessage = await _mediator.Send(command);
            
            return Ok(resultMessage);
        }
    }
}
