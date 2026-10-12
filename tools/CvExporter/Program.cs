using PortfolioAdmin;
using System.Text.Json;

try
{
    if (args.Contains("--install-browser")) { Environment.ExitCode = Microsoft.Playwright.Program.Main(["install", "chromium"]); return; }
    var root = Directory.GetCurrentDirectory();
    if (!File.Exists(Path.Combine(root, "content/schema.json"))) throw new InvalidOperationException("Run the exporter from the portfolio-v2 project root.");
    var store = new ContentStore(root); var cv = new CvService();
    if (args.Contains("--export-public"))
    {
        await cv.ExportPublic(store, store.Load());
        Console.WriteLine("Generated public PDF and Word CVs from published content.");
    }
    else if (args.Length == 4 && args[0] == "--input" && args[2] == "--output")
    {
        // A private request must be kept outside Git; this mode never copies it into public assets.
        var request = JsonSerializer.Deserialize<ExportRequest>(File.ReadAllText(args[1]), ContentStore.Json) ?? throw new InvalidOperationException("Invalid export request.");
        store.Validate(request.Content);
        var output = Path.GetFullPath(args[3]);
        var publicPath = Path.Combine(root, "public") + Path.DirectorySeparatorChar;
        if (output.StartsWith(publicPath, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Private exports cannot be saved in public/.");
        Directory.CreateDirectory(output);
        await File.WriteAllBytesAsync(Path.Combine(output, "cv.pdf"), await cv.Pdf(request));
        await File.WriteAllBytesAsync(Path.Combine(output, "cv.docx"), cv.Word(request));
        Console.WriteLine("Saved private PDF and Word exports to " + output);
    }
    else throw new InvalidOperationException("Use npm run export:public, or --input .local/private-cv.json --output .local/exports.");
}
catch (Exception error) { Console.Error.WriteLine(error.Message); Environment.ExitCode = 1; }
