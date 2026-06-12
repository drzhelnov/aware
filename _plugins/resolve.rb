module CurrentResolveAlias
  class Generator < Jekyll::Generator
    safe true

    def generate(site)
      version = site.data.dig("resolve", "current") || "v1"
      prefix = "/resolve/#{version}/"

      site.pages.each do |page|
        next unless page.url.start_with?(prefix)

        encoded_uri = page.url.delete_prefix(prefix)
        alias_url = "/resolve/#{encoded_uri}"

        site.pages << RedirectPage.new(site, alias_url, page.url)
      end
    end
  end

  class RedirectPage < Jekyll::Page
    def initialize(site, permalink, target)
      @site = site
      @base = site.source
      @dir = ""
      @basename = "resolve-alias"
      @ext = ".html"
      @name = "resolve-alias.html"

      @content = ""
      @data = {
        "layout" => "redirect",
        "permalink" => permalink,
        "redirect" => target
      }
    end
  end
end
