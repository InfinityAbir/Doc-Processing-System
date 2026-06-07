using ProcessingService.Services;
using ProcessingService.Services.Kafka;
using Shared.Kafka;

var builder = WebApplication.CreateBuilder(args);

// ✅ Controllers
builder.Services.AddControllers();


// ✅ CORE SERVICES
builder.Services.AddScoped<FileProcessingService>();

// ✅ Use ONLY ProcessingService ConversionService
builder.Services.AddScoped<ConversionService>();

// ✅ Kafka Producer (Singleton is correct)
builder.Services.AddSingleton<KafkaProducer>();

// ✅ Background Kafka Consumer
builder.Services.AddHostedService<KafkaConsumer>();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();