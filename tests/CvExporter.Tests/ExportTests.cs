using Xunit;
using PortfolioAdmin;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Validation;

public class ExportTests
{
    private static PortfolioDocument Seed()
    {
        var root = new DirectoryInfo(AppContext.BaseDirectory);
        while (root is not null && !File.Exists(Path.Combine(root.FullName, "content/schema.json"))) root = root.Parent;
        Assert.NotNull(root);
        return new ContentStore(root.FullName).Parse(File.ReadAllText(Path.Combine(root.FullName, "tests/fixtures/portfolio.json")));
    }
    [Fact]
    public void PublicProjectionRemovesUnpublishedProjectsAndCareerEntries()
    {
        var data = Seed(); data.Projects[0] = data.Projects[0] with { Published = false }; data.Experience.Add(new("Hidden", "", "", "", "PRIVATE_DRAFT", false));
        var result = ContentStore.PublicProjection(data);
        Assert.DoesNotContain(result.Projects, p => p.Id == "data-auto-mapper"); Assert.DoesNotContain("data-auto-mapper", result.Cv.ProjectIds); Assert.Empty(result.Experience);
    }
    [Fact]
    public void WordContainsSharedTextHyperlinksAndValidOpenXml()
    {
        var request = new ExportRequest(Seed()); var service = new CvService();
        using var stream = new MemoryStream(service.Word(request)); using var word = WordprocessingDocument.Open(stream, false);
        var errors = new OpenXmlValidator().Validate(word).ToArray(); Assert.True(errors.Length == 0, string.Join("\n", errors.Select(e => e.Description)));
        var text = word.MainDocumentPart!.Document.Body!.InnerText;
        foreach (var block in CvService.Blocks(request)) Assert.Contains(block.Text, text);
        Assert.Equal(3, word.MainDocumentPart.HyperlinkRelationships.Count());
    }
    [Fact]
    public void SectionOrderAndTailoredSummaryMatchBothFormats()
    {
        var data = Seed(); data = data with { Cv = data.Cv with { Summary = "TAILORED SUMMARY", Sections = ["projects", "summary"], ProjectIds = ["parking-platform", "data-auto-mapper"] } };
        var request = new ExportRequest(data); var html = CvService.Html(request); var blocks = CvService.Blocks(request);
        Assert.True(html.IndexOf("Parking Backend") < html.IndexOf("Data Auto Mapper")); Assert.True(html.IndexOf("Projects</h2>") < html.IndexOf("Summary</h2>"));
        Assert.Contains(blocks, b => b.Text == "TAILORED SUMMARY"); Assert.DoesNotContain(blocks, b => b.Text == "Education");
    }
    [Fact]
    public void ExportEscapesMarkupAndAllowsLongText()
    {
        var data = Seed(); data = data with { Cv = data.Cv with { Summary = "<script>unsafe</script>" + new string('x', 2500), Sections = ["summary"] } };
        var html = CvService.Html(new(data)); Assert.DoesNotContain("<script>", html); Assert.Contains("&lt;script&gt;", html); Assert.Contains(new string('x', 2500), html);
    }
    [Fact]
    public async Task PdfIsGeneratedFromSelectedContent()
    {
        var pdf = await new CvService().Pdf(new(Seed()));
        Assert.True(pdf.Length > 5000); Assert.Equal("%PDF", System.Text.Encoding.ASCII.GetString(pdf, 0, 4));
    }
    [Fact]
    public void CustomLayerSkillsAreIncludedInCv()
    {
        var data = Seed(); data.Skills.Add(new("PowerApps", "Mobile"));
        Assert.Contains(CvService.Blocks(new(data)), block => block.Text == "Mobile: PowerApps");
    }
}
