# GitHub Action to integrate your CI with Omnistrate

[![GitHub Super-Linter](https://github.com/omnistrate/update-image-config/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/omnistrate/update-image-config/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/omnistrate/update-image-config/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/omnistrate/update-image-config/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

## Introduction

This action allows you to leverage your existing GitHub action workflows
to update your container image tags on the Omnistrate SaaS builder platform.
Once the action completes, you can schedule your image updates on your fleet
by following the [docs](https://docs.omnistrate.com/guides/patching/).

## Usage

```yaml
- name: Update Docker Image Tag on Omnistrate
  uses: omnistrate/update-image-config@v1
  with:
     service-id: ${{ inputs.service-id }} # REQUIRED
     image-config-id: ${{ inputs.image-config-id }} # REQUIRED
     service-api-id: ${{ inputs.service-api-id }} # REQUIRED
     product-tier-id: ${{ inputs.product-tier-id }} # REQUIRED
     tag:  # REQUIRED: Output from your step containing the new tag
     release-description: ${{ inputs.release-description }} # OPTIONAL
```

**Hypothetical CI workflow example:**

```yaml
name: Deploy

on:
  workflow_dispatch:
  release:
    types: [published]

env:
  PLATFORMS: linux/arm64,linux/amd64

jobs:
  deploy:
    name: Deploy service image to fleet
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
    
      - name: Generate token
        id: generate_token
        uses: tibdex/github-app-token@3beb63f4bd073e61482598c45c71c1019b59b73a
        with:
          app_id: ${{ secrets.CI_APP_ID }}
          private_key: ${{ secrets.CI_APP_PRIVATE_KEY }}
        
      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        with: 
          platforms: ${{ env.PLATFORMS }}

      # Extract metadata (tags, labels) for Docker
      # https://github.com/docker/metadata-action
      - name: Extract Docker metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ vars.ECR_REGISTRY }}/${{ vars.IMAGE_NAME }}
          tags: |         
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=semver,pattern={{major}}
            type=sha,format=long

      # Build and push Docker image with Buildx
      # https://github.com/docker/build-push-action
      - name: Build and push multi-arch
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          platforms: ${{ env.PLATFORMS }}
          build-args: |
              GIT_USER=api 
              GIT_TOKEN=${{ steps.generate_token.outputs.token }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

      # Update the image tag on Omnistrate
      - name: Update Docker Image Tag on Omnistrate
        uses: omnistrate/update-image-config@v1
        with:
          service-id: ${{ inputs.service-id }}
          image-config-id: ${{ inputs.image-config-id }}
          service-api-id: ${{ inputs.service-api-id }}
          product-tier-id: ${{ inputs.product-tier-id }}
          tag: ${{ steps.meta.outputs.version }}
          release-description: ${{ inputs.release-description }}
          username: ${{ secrets.OMNISTRATE_USERNAME }}
          password: ${{ secrets.OMNISTRATE_PASSWORD }}
```

## Inputs

| Name                  | Description                                                  | Required | Default |
|-----------------------|--------------------------------------------------------------|----------|---------|
| `service-id`          | The service ID to update                                     | `true`   |         |
| `image-config-id`     | The image config ID to update                                | `true`   |         |
| `service-api-id`      | The service API ID to update                                 | `true`   |         |
| `product-tier-id`     | The product tier ID to update                                | `true`   |         |
| `tag`                 | The new tag to update the image config with                  | `true`   |         |
| `release-description` | The release description to use for the new service version   | `false`  |         |
| `username`            | The username to authenticate against the Omnistrate platform | `false`  |         |
| `password`            | The password to authenticate against the Omnistrate platform | `false`  |         |

## Outputs

| Name                  | Description                              |
|-----------------------|------------------------------------------|
| `service-id`          | The service ID that was updated          |
| `image-config-id`     | The image config ID that was updated     |
| `service-api-id`      | The service API ID that was updated      |
| `product-tier-id`     | The product tier ID that was updated     |
| `tag`                 | The tag that was updated                 |
| `release-description` | The release description that was updated |
