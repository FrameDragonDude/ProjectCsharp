using Backend.Services;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Backend.Controllers
{
    public class ChangePasswordRequest
        {
            public string OldPassword { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
        }

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IMediator _mediator;

        public AuthController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterCommand command)
        {
            try 
            { 
                var userId = await _mediator.Send(command);
                return Ok(new { UserId = userId, Message = "Đăng ký thành công!" }); 
            }
            catch (Exception ex) 
            { 
                return BadRequest(new { Message = ex.Message }); 
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginCommand command)
        {
            try 
            { 
                var token = await _mediator.Send(command);
                return Ok(new { Token = token, Message = "Đăng nhập thành công!" }); 
            }
            catch (Exception ex) 
            { 
                return BadRequest(new { Message = ex.Message }); 
            }
        }

        [Authorize] 
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            try 
            { 
                var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
                
                if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
                {
                    return Unauthorized(new { Message = "Không xác định được danh tính người dùng!" });
                }

                var command = new ChangePasswordCommand(userId, request.OldPassword, request.NewPassword);
                var resultMessage = await _mediator.Send(command);
                
                return Ok(new { Message = resultMessage }); 
            }
            catch (Exception ex) 
            { 
                return BadRequest(new { Message = ex.Message }); 
            }
        }
    }
}