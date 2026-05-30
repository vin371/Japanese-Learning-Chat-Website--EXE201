using System.Threading.Tasks;
using backend.Data;
using backend.DTOs.Admin;
using backend.Services.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

/// <summary>Endpoint công khai (không cần đăng nhập) cho banner client.</summary>
[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class PublicController : ControllerBase
{
    /// <summary>Thông báo đã xuất bản mới nhất (hoặc announcement = null).</summary>
    [HttpGet("system-announcements/latest")]
    public async Task<ActionResult<object>> GetLatestSystemAnnouncement([FromServices] IAdminService admin)
    {
        try
        {
            SystemAnnouncementPublicDto? dto = await admin.GetLatestPublishedAnnouncementAsync();
            return Ok(new { announcement = dto });
        }
        catch (Exception ex) when (DbExceptionHelper.IsConnectionError(ex))
        {
            return StatusCode(503, new { message = "Không kết nối được cơ sở dữ liệu.", announcement = (object?)null });
        }
    }
}
