<<<<<<< HEAD
using Backend.Models;
=======
﻿using Backend.Services;
>>>>>>> 3a33a33 (Chinh loi sua mat khau)
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
                return BadRequest("Loại theo dõi không hợp lệ. Chỉ chấp nhận 'User' hoặc 'Artist'.");
            }

            var myUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(myUserIdValue, out var myUserId)) return Unauthorized();

            if (type == "User" && myUserId == targetId) 
            {
                return BadRequest("Bạn không thể theo dõi chính mình.");
            }

            var command = new ToggleFollowCommand(myUserId, targetId, type);
            var resultMessage = await _mediator.Send(command);
            
            return Ok(resultMessage);
        }
    }
}
