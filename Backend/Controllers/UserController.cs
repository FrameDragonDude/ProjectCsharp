using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Services;

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

            if (profile == null) return NotFound("Khong tim thay thong tin ho so.");
            
            return Ok(profile);
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromForm] UpdateProfileRequest request)
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdValue, out var userId)) return Unauthorized();

            string? avatarUrl = null;

            if (request.AvatarFile != null)
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var uniqueFileName = Guid.NewGuid().ToString() + "_" + request.AvatarFile.FileName;
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await request.AvatarFile.CopyToAsync(fileStream);
                }

                avatarUrl = $"/uploads/{uniqueFileName}"; 
            }

            var command = new UpdateProfileCommand(userId, request.FullName, request.Bio, avatarUrl);
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
    }

    public class UpdateProfileRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public IFormFile? AvatarFile { get; set; }
    }
}