# Web Calculator Engine

A collection of tested, browser-based calculator engines and reusable UI components for building fast static calculator websites.

## Quick start

Requires Node 22+.

```sh
npm ci
npm run check
npm run build:dev
npm run serve
npm run test:browser
```

Production builds use the site's canonical origin for generated URLs:

```sh
SITE_URL=https://www.example.com npm run build
```

The build produces a static `dist/` directory that can be deployed to a static host.

## Architecture

```text
src/calculators/   Pure calculation engines and math logic.
src/adapters/      Input parsing, validation and display view models.
src/components/    Shared HTML components.
src/brand/         Logo, icons and share image, all derived from one source logo.
src/lib/           Formatting, escaping and validation utilities.
src/content/       Site configuration and calculator registry.
src/pages/         Static page definitions.
src/client/        Browser controllers.
src/styles/        Mobile-first CSS.
scripts/           Build, audit and local preview tooling.
tests/             Unit, site and browser tests.
```

The data flow is intentionally simple:

```text
form input → adapter → engine → view model → components → HTML
```

Calculations run in the browser. Pages are statically generated so the core content is available without client-side rendering.

## Development

Run the full validation suite before submitting changes:

```sh
npm run check
npm run test:browser
```

When adding a calculator, add a tested calculation engine, connect it through an adapter, compose the result UI, register the page, and verify the generated output.

## License

See the repository license and package metadata for project terms.
