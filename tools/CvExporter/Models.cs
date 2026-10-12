namespace PortfolioAdmin;

public record Profile(string Name, string Role, string Summary, string Location, string Email, string Github, string Linkedin, string? Photo = null);
public record Skill(string Name, string Layer);
public record Screenshot(string Src, string Alt);
public record Project(string Id, string Title, string Category, string Description, string Problem, string Contribution, string Decisions, string Outcome, List<string> Technologies, List<string> Layers, List<Screenshot> Screenshots, bool Featured, bool Published, string Accent);
public record Entry(string Title, string Organization, string Start, string End, string Details, bool Published);
public record CvSelection(string Summary, List<string> Sections, List<string> ProjectIds);
public record LayerDefinition(string Name, string Description, string Icon, int Order);
public record PortfolioDocument(int SchemaVersion, Profile Profile, List<Skill> Skills, List<Project> Projects, List<Entry> Experience, List<Entry> Education, CvSelection Cv, List<LayerDefinition>? Layers = null);
public record ExportRequest(PortfolioDocument Content, string PrivatePhone = "", string PrivateAddress = "");
