# Local CLAP bundle

The CLAP weights are a local dependency for the XIV audio lane. They are not
part of the public Next.js build and must not be committed or deployed to
Vercel.

## Prepare the bundle

The three files downloaded from Hugging Face should be in `~/Downloads`:

- `pytorch_model.bin`
- `config.json`
- `preprocessor_config.json`

From the repository root, run:

```bash
npm run prepare:clap
```

This copies them into:

```text
data/xiv/models/clap-htsat-unfused/
```

`data/xiv/` is ignored by Git because it contains local media, models, and
machine-specific metadata. To use another source or destination:

```bash
CLAP_SOURCE_DIR=/path/to/downloads \
CLAP_TARGET_DIR=/path/to/local/model \
npm run prepare:clap
```

CLAP is an audio embedding model. It describes audio for search or matching;
it is not the pose model and it is not a beat clock. The Dance Lab continues
to use MediaPipe for movement and its clock for timing until the local audio
adapter is added.
