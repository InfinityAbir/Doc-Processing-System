using Microsoft.AspNetCore.Mvc;
using ProcessingService.Services;

namespace ProcessingService.Controllers
{
    [ApiController]
    [Route("api/process")]
    public class ProcessingController : ControllerBase
    {
        private readonly FileProcessingService _processingService;

        public ProcessingController(FileProcessingService processingService)
        {
            _processingService = processingService;
        }

        [HttpPost]
        public IActionResult Process([FromBody] string filePath)
        {
            var result = _processingService.Process(filePath);

            return Ok(new
            {
                Message = result
            });
        }
    }
}