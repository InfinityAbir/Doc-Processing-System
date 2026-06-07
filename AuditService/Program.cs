using AuditService.Services.Kafka;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();

// 🔥 Register Kafka Consumer (VERY IMPORTANT)
builder.Services.AddHostedService<KafkaAuditConsumer>();

// 🔥 Swagger (REQUIRED for /swagger UI)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure pipeline

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();