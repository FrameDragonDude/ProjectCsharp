using Backend.Models;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
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
    }
}