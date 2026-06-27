using Backend.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.IO;

namespace Backend.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly IMediator _mediator;

        public AdminController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("artists")]
        public async Task<IActionResult> CreateArtist([FromBody] CreateArtistCommand command)
        {
            try
            {
                var resultMessage = await _mediator.Send(command);
                return Ok(new { Message = resultMessage });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPut("users/{targetUserId}/profile")]
        public async Task<IActionResult> UpdateUserProfile(int targetUserId, [FromForm] UpdateProfileRequest request)
        {
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

            var command = new UpdateProfileCommand(
                UserId: targetUserId, 
                FullName: request.FullName, 
                Bio: request.Bio, 
                AvatarUrl: avatarUrl 
            );
            
            var success = await _mediator.Send(command);
            
            if (success)
            {
                return Ok(new { Message = "Cập nhật hồ sơ thành công bởi Admin." });
            }
            return BadRequest(new { Message = "Không tìm thấy người dùng hoặc cập nhật thất bại." });
        }
    }
}