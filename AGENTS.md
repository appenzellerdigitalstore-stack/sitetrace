<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the landing page and its directory at the index route; shared visual effects live in small components so animation stays isolated from page interactions.
- Define visual roles and effects in the global CSS design system; use the existing Button and Dialog controls for consistent accessible interaction.
- Render digital rain with a client-initialized canvas that respects reduced motion; this avoids shipping a large background video.
- Keep the fixed rain behind each page in an isolated stacking context and share the sticky header and client-initialized clock across content routes so navigation and time remain consistent without hydration mismatches.
- Serve every diagnostic at /tools/$slug using a shared workspace and per-tool configuration; isolate sample diagnostic responses from local utility logic so live integrations can replace one clear boundary.
