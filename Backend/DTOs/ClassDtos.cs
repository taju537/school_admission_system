using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SchoolAdmission.Api.DTOs;

public class CreateClassRequest
{
    [Required(ErrorMessage = "ক্লাসের নাম অবশ্যই প্রদান করতে হবে।")]
    [StringLength(256, MinimumLength = 2, ErrorMessage = "ক্লাসের নাম ২ থেকে ২৫৬ অক্ষরের মধ্যে হতে হবে।")]
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "মোট আসন সংখ্যা প্রদান করতে হবে।")]
    [Range(1, 10000, ErrorMessage = "মোট আসন সংখ্যা কমপক্ষে ১ হতে হবে।")]
    [JsonPropertyName("totalSeats")]
    public int TotalSeats { get; set; }
}

public class CreateClassResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("totalSeats")]
    public int TotalSeats { get; set; }
}

public class ClassResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("totalSeats")]
    public int TotalSeats { get; set; }

    [JsonPropertyName("heldSeats")]
    public int HeldSeats { get; set; }

    [JsonPropertyName("confirmedSeats")]
    public int ConfirmedSeats { get; set; }

    [JsonPropertyName("availableSeats")]
    public int AvailableSeats { get; set; }
}

