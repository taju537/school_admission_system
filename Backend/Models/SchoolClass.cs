namespace SchoolAdmission.Api.Models;

public class SchoolClass
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int TotalSeats { get; set; }
    public int ConfirmedSeats { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public ICollection<Hold> Holds { get; set; } = new List<Hold>();
}
