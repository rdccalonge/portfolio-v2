using System.Net;
using System.Text;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.Playwright;

namespace PortfolioAdmin;

public sealed class CvService
{
    public record Block(string Kind, string Text, string? Url = null);
    public static List<Block> Blocks(ExportRequest request)
    {
        var d = request.Content; var blocks = new List<Block> { new("name", d.Profile.Name), new("role", d.Profile.Role), new("link", d.Profile.Email, "mailto:" + d.Profile.Email), new("link", d.Profile.Github, d.Profile.Github), new("link", d.Profile.Linkedin, d.Profile.Linkedin) };
        foreach (var detail in new[] { d.Profile.Location, request.PrivatePhone, request.PrivateAddress }.Where(s => !string.IsNullOrWhiteSpace(s))) blocks.Add(new("text", detail));
        foreach (var section in d.Cv.Sections)
        {
            var body = new List<Block>();
            switch (section)
            {
                case "summary": body.Add(new("text", string.IsNullOrWhiteSpace(d.Cv.Summary) ? d.Profile.Summary : d.Cv.Summary)); break;
                case "skills": foreach (var layer in d.Skills.GroupBy(s => s.Layer)) body.Add(new("text", layer.Key + ": " + string.Join(", ", layer.Select(s => s.Name)))); break;
                case "experience": AddEntries(body, d.Experience); break;
                case "education": AddEntries(body, d.Education); break;
                case "certifications":
                    foreach (var cert in d.Certifications ?? [])
                    {
                        if (!cert.Published) continue;
                        body.Add(new("subheading", cert.Name));
                        var detail = string.Join(" | ", new[] { cert.Issuer, cert.Issued }.Where(value => !string.IsNullOrWhiteSpace(value)));
                        if (detail.Length > 0) body.Add(new("text", detail));
                        if (cert.Url.Length > 0) body.Add(new("link", "Verify credential", cert.Url));
                    }
                    break;
                case "projects":
                    foreach (var id in d.Cv.ProjectIds)
                    {
                        var p = d.Projects.FirstOrDefault(p => p.Id == id); if (p is null) continue;
                        body.Add(new("subheading", p.Title)); body.Add(new("text", p.Description));
                        foreach (var text in new[] { p.Contribution, p.Decisions, p.Outcome }.Where(s => !string.IsNullOrWhiteSpace(s))) body.Add(new("text", text));
                        if (p.Technologies.Count > 0) body.Add(new("text", "Technologies: " + string.Join(", ", p.Technologies)));
                    }
                    break;
            }
            if (body.Count > 0) { blocks.Add(new("heading", char.ToUpperInvariant(section[0]) + section[1..])); blocks.AddRange(body); }
        }
        return blocks;
    }
    private static void AddEntries(List<Block> blocks, IEnumerable<Entry> entries)
    {
        foreach (var e in entries) { blocks.Add(new("subheading", e.Title)); if (e.Organization.Length > 0) blocks.Add(new("meta", e.Organization)); var dates = string.Join(" - ", new[] { e.Start, e.End }.Where(s => s.Length > 0)); if (dates.Length > 0) blocks.Add(new("meta", dates)); if (e.Details.Length > 0) blocks.Add(new("text", e.Details)); }
    }
    public static string Html(ExportRequest request)
    {
        var html = new StringBuilder("<!doctype html><html lang='en'><head><meta charset='utf-8'><title>CV</title><style>@page{size:A4;margin:18mm}body{font:10.5pt/1.5 Arial,sans-serif;color:#172333}h1{font-size:26pt;line-height:1.1;margin:0 0 5pt}h2{font-size:12pt;margin:17pt 0 6pt;border-bottom:1px solid #c8d1da;padding-bottom:4pt;break-after:avoid}h3{font-size:11pt;margin:10pt 0 3pt;break-after:avoid}p{margin:4pt 0;white-space:pre-wrap;overflow-wrap:anywhere;orphans:3;widows:3}a{color:#174666;text-decoration:none;overflow-wrap:anywhere}.role{font-size:12pt;color:#43556a}header{margin-bottom:14pt}</style></head><body>");
        foreach (var block in Blocks(request))
        {
            var text = WebUtility.HtmlEncode(block.Text);
            if (block.Kind == "meta") { html.Append("<p style='break-after:avoid'>").Append(text).Append("</p>"); continue; }
            html.Append(block.Kind switch { "name" => $"<h1>{text}</h1>", "role" => $"<p class='role'>{text}</p>", "heading" => $"<h2>{text}</h2>", "subheading" => $"<h3>{text}</h3>", "link" => $"<p><a href='{WebUtility.HtmlEncode(block.Url)}'>{text}</a></p>", _ => $"<p>{text}</p>" });
        }
        return html.Append("</body></html>").ToString();
    }
    public async Task<byte[]> Pdf(ExportRequest request)
    {
        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync(new() { Headless = true, ExecutablePath = Environment.GetEnvironmentVariable("PORTFOLIO_BROWSER") });
        var page = await browser.NewPageAsync();
        await page.RouteAsync("**/*", route => route.AbortAsync());
        await page.SetContentAsync(Html(request));
        return await page.PdfAsync(new() { Format = "A4", PreferCSSPageSize = true, PrintBackground = true });
    }
    public byte[] Word(ExportRequest request)
    {
        using var stream = new MemoryStream();
        using (var doc = WordprocessingDocument.Create(stream, WordprocessingDocumentType.Document, true))
        {
            var main = doc.AddMainDocumentPart(); var body = new Body(); main.Document = new Document(body);
            foreach (var block in Blocks(request))
            {
                var size = block.Kind == "name" ? "48" : block.Kind == "heading" ? "24" : "21";
                var properties = new ParagraphProperties(new SpacingBetweenLines { After = "90" });
                if (block.Kind is "name" or "heading" or "subheading" or "meta") properties.AddChild(new KeepNext(), true);
                if (block.Kind is "name" or "heading" or "subheading") properties.AddChild(new KeepLines(), true);
                var para = new Paragraph(properties);
                var run = new Run(new RunProperties(new RunFonts { Ascii = "Arial", HighAnsi = "Arial" }, new FontSize { Val = size }));
                if (block.Kind is "name" or "heading" or "subheading") run.RunProperties!.AddChild(new Bold(), true);
                var lines = block.Text.Split('\n');
                for (var i = 0; i < lines.Length; i++) { if (i > 0) run.Append(new Break()); run.Append(new Text(lines[i].TrimEnd('\r')) { Space = SpaceProcessingModeValues.Preserve }); }
                if (block.Url is not null) { var relation = main.AddHyperlinkRelationship(new Uri(block.Url), true); para.Append(new Hyperlink(run) { Id = relation.Id }); } else para.Append(run);
                body.Append(para);
            }
            body.Append(new SectionProperties(new PageSize { Width = 11906, Height = 16838 }, new PageMargin { Top = 1020, Bottom = 1020, Left = 1020, Right = 1020 })); main.Document.Save();
        }
        return stream.ToArray();
    }
    public async Task ExportPublic(ContentStore store, PortfolioDocument content)
    {
        var request = new ExportRequest(ContentStore.PublicProjection(content));
        var pdf = await Pdf(request); var word = Word(request);
        var dir = Path.Combine(store.Root, "public/downloads"); Directory.CreateDirectory(dir);
        await File.WriteAllBytesAsync(Path.Combine(dir, "reni-calonge-cv.pdf"), pdf);
        await File.WriteAllBytesAsync(Path.Combine(dir, "reni-calonge-cv.docx"), word);
    }
}
