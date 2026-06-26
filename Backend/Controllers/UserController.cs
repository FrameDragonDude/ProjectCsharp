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
        [HttpPost("avatar")]
        public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file)
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdValue, out var userId)) return Unauthorized();

            if (file == null || file.Length == 0) return BadRequest("KhÃ´ng tÃ¬m tháº¥y file.");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
                return BadRequest("Chá»‰ cháº¥p nháº­n file áº£nh.");

            var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "avatars");
            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            var fileName = $"avatar_{userId}_{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(folderPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"/images/avatars/{fileName}";
            return Ok(new { AvatarUrl = url });
        }

        [HttpGet("following")]
        public async Task<IActionResult> GetFollowing()
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdValue, out var userId)) return Unauthorized();

            var query = new GetFollowingQuery(userId);
            var followingList = await _mediator.Send(query);

            return Ok(followingList);
        }
    }
    public record UpdateProfileRequest(string FullName, string Bio, string AvatarUrl);
}
