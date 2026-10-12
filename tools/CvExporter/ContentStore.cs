using System.Text.Json;
using System.Text.Json.Nodes;
using System.Security.Cryptography;
using System.Text;
using Json.Schema;

namespace PortfolioAdmin;

public sealed class ContentStore(string root)
{
    public string Root { get; } = Path.GetFullPath(root);
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web) { WriteIndented = true, DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull };
    private JsonSchema Schema => JsonSchema.FromFile(Path.Combine(Root, "content/schema.json"));
    public string PublicPath => Path.Combine(Root, "content/portfolio.json");
    public PortfolioDocument Load() => Parse(File.ReadAllText(Path.Combine(Root, ".local/public-content.json")));
    public PortfolioDocument Parse(string text)
    {
        var node = JsonNode.Parse(text) ?? throw new InvalidOperationException("Content is empty.");
        var result = Schema.Evaluate(node, new EvaluationOptions { OutputFormat = OutputFormat.List });
        if (!result.IsValid) throw new InvalidOperationException("Content does not match the schema: " + JsonSerializer.Serialize(result, Json));
        var doc = JsonSerializer.Deserialize<PortfolioDocument>(text, Json) ?? throw new InvalidOperationException("Invalid content.");
        Validate(doc); return doc;
    }
    public void Validate(PortfolioDocument doc)
    {
        var result = Schema.Evaluate(JsonSerializer.SerializeToNode(doc, Json), new EvaluationOptions { OutputFormat = OutputFormat.List });
        if (!result.IsValid) throw new InvalidOperationException("Invalid fields. Check required names, slugs, links, lengths, and section selections.");
        if (doc.Projects.Select(p => p.Id).Distinct().Count() != doc.Projects.Count) throw new InvalidOperationException("Project slugs must be unique.");
        if (doc.Cv.ProjectIds.Any(id => !doc.Projects.Any(p => p.Id == id))) throw new InvalidOperationException("The CV refers to an unknown project.");
    }
    public static void AtomicWrite(string path, string text)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        var temp = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
        try { File.WriteAllText(temp, text, new UTF8Encoding(false)); File.Move(temp, path, true); }
        finally { if (File.Exists(temp)) File.Delete(temp); }
    }
    public static PortfolioDocument PublicProjection(PortfolioDocument doc)
    {
        var projects = doc.Projects.Where(p => p.Published).ToList();
        return doc with { Projects = projects, Experience = doc.Experience.Where(e => e.Published).ToList(), Education = doc.Education.Where(e => e.Published).ToList(), Cv = doc.Cv with { ProjectIds = doc.Cv.ProjectIds.Where(id => projects.Any(p => p.Id == id)).ToList() } };
    }
}
