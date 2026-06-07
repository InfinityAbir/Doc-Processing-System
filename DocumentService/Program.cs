using DocumentService.Hubs;
using DocumentService.Services;
using DocumentService.Services.Kafka;
using Shared.Kafka;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddSignalR();

builder.Services.AddSingleton<KafkaProducer>();
builder.Services.AddHostedService<DocumentProcessedConsumer>();

// ✅ Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ✅ Your custom service
builder.Services.AddScoped<FileService>();

// ✅ ✅ ADD CORS HERE
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials(); // 🔥 REQUIRED for SignalR
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline

// ✅ Enable Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend"); // 🔥 MUST come BEFORE MapHub

app.MapHub<DocumentHub>("/hubs/document");


app.UseAuthorization();

app.MapControllers();

app.Run();