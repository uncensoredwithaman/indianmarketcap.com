import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";

/** Naye files (base64 mein, taaki copy-paste ka jhanjhat na ho). */
const newFiles = {
  "src/lib/currency.ts": "aW1wb3J0IHsgY3JlYXRlIH0gZnJvbSAienVzdGFuZCI7CgpleHBvcnQgdHlwZSBQcmljZUN1cnJlbmN5ID0gIklOUiIgfCAiVVNEIjsKCmNvbnN0IEtFWSA9ICJpbmRpYW5zdG9ja3MtcHJpY2UtY3VycmVuY3kiOwoKdHlwZSBDdXJyZW5jeVN0YXRlID0gewogIGN1cnJlbmN5OiBQcmljZUN1cnJlbmN5OwogIHNldEN1cnJlbmN5OiAoY3VycmVuY3k6IFByaWNlQ3VycmVuY3kpID0+IHZvaWQ7CiAgaHlkcmF0ZTogKCkgPT4gdm9pZDsKfTsKCmV4cG9ydCBjb25zdCB1c2VDdXJyZW5jeSA9IGNyZWF0ZTxDdXJyZW5jeVN0YXRlPigoc2V0KSA9PiAoewogIGN1cnJlbmN5OiAiSU5SIiwKICBzZXRDdXJyZW5jeTogKGN1cnJlbmN5KSA9PiB7CiAgICB0cnkgewogICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oS0VZLCBjdXJyZW5jeSk7CiAgICB9IGNhdGNoIHsKICAgICAgLy8gUHJpdmF0ZSBtb2RlIGV0YzogdGhlIGNob2ljZSBqdXN0IHdvbid0IHBlcnNpc3QuCiAgICB9CiAgICBzZXQoeyBjdXJyZW5jeSB9KTsKICB9LAogIGh5ZHJhdGU6ICgpID0+IHsKICAgIHRyeSB7CiAgICAgIGNvbnN0IHNhdmVkID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKEtFWSk7CiAgICAgIGlmIChzYXZlZCA9PT0gIlVTRCIgfHwgc2F2ZWQgPT09ICJJTlIiKSBzZXQoeyBjdXJyZW5jeTogc2F2ZWQgfSk7CiAgICB9IGNhdGNoIHsKICAgICAgLy8gSWdub3JlIHVucmVhZGFibGUgc3RvcmFnZS4KICAgIH0KICB9LAp9KSk7Cg==",
  "src/lib/treemap.ts": "ZXhwb3J0IHR5cGUgVHJlZW1hcEl0ZW08VD4gPSB7IHZhbHVlOiBudW1iZXI7IGRhdGE6IFQgfTsKZXhwb3J0IHR5cGUgVHJlZW1hcENlbGw8VD4gPSB7IHg6IG51bWJlcjsgeTogbnVtYmVyOyB3OiBudW1iZXI7IGg6IG51bWJlcjsgZGF0YTogVDsgdmFsdWU6IG51bWJlciB9OwoKZnVuY3Rpb24gd29yc3QoYXJlYXM6IG51bWJlcltdLCBzaWRlOiBudW1iZXIpOiBudW1iZXIgewogIGNvbnN0IHN1bSA9IGFyZWFzLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApOwogIGNvbnN0IG1heCA9IE1hdGgubWF4KC4uLmFyZWFzKTsKICBjb25zdCBtaW4gPSBNYXRoLm1pbiguLi5hcmVhcyk7CiAgY29uc3QgczIgPSBzaWRlICogc2lkZTsKICByZXR1cm4gTWF0aC5tYXgoKHMyICogbWF4KSAvIChzdW0gKiBzdW0pLCAoc3VtICogc3VtKSAvIChzMiAqIG1pbikpOwp9CgovKiogU3F1YXJpZmllZCB0cmVlbWFwIChCcnVscyBldCBhbC4pLiBJdGVtcyB3aXRoIHZhbHVlIDw9IDAgYXJlIGRyb3BwZWQuICovCmV4cG9ydCBmdW5jdGlvbiBzcXVhcmlmeTxUPigKICBpbnB1dDogVHJlZW1hcEl0ZW08VD5bXSwKICB4OiBudW1iZXIsCiAgeTogbnVtYmVyLAogIHc6IG51bWJlciwKICBoOiBudW1iZXIsCik6IFRyZWVtYXBDZWxsPFQ+W10gewogIGNvbnN0IGl0ZW1zID0gaW5wdXQuZmlsdGVyKChpdGVtKSA9PiBpdGVtLnZhbHVlID4gMCkuc29ydCgoYSwgYikgPT4gYi52YWx1ZSAtIGEudmFsdWUpOwogIGNvbnN0IG91dDogVHJlZW1hcENlbGw8VD5bXSA9IFtdOwogIGlmIChpdGVtcy5sZW5ndGggPT09IDAgfHwgdyA8PSAwIHx8IGggPD0gMCkgcmV0dXJuIG91dDsKICBjb25zdCB0b3RhbCA9IGl0ZW1zLnJlZHVjZSgoc3VtLCBpdGVtKSA9PiBzdW0gKyBpdGVtLnZhbHVlLCAwKTsKICBjb25zdCBzY2FsZSA9ICh3ICogaCkgLyB0b3RhbDsKICBsZXQgcmVzdCA9IGl0ZW1zLm1hcCgoaXRlbSkgPT4gKHsgLi4uaXRlbSwgYXJlYTogaXRlbS52YWx1ZSAqIHNjYWxlIH0pKTsKICBsZXQgY3ggPSB4OwogIGxldCBjeSA9IHk7CiAgbGV0IGN3ID0gdzsKICBsZXQgY2ggPSBoOwogIHdoaWxlIChyZXN0Lmxlbmd0aCA+IDApIHsKICAgIGNvbnN0IHNpZGUgPSBNYXRoLm1pbihjdywgY2gpOwogICAgY29uc3Qgcm93ID0gW3Jlc3RbMF0hXTsKICAgIGxldCByb3dBcmVhcyA9IFtyZXN0WzBdIS5hcmVhXTsKICAgIGxldCBpID0gMTsKICAgIHdoaWxlIChpIDwgcmVzdC5sZW5ndGgpIHsKICAgICAgY29uc3QgbmV4dCA9IHJlc3RbaV0hOwogICAgICBjb25zdCBncm93biA9IFsuLi5yb3dBcmVhcywgbmV4dC5hcmVhXTsKICAgICAgaWYgKHdvcnN0KGdyb3duLCBzaWRlKSA8PSB3b3JzdChyb3dBcmVhcywgc2lkZSkpIHsKICAgICAgICByb3cucHVzaChuZXh0KTsKICAgICAgICByb3dBcmVhcyA9IGdyb3duOwogICAgICAgIGkgKz0gMTsKICAgICAgfSBlbHNlIHsKICAgICAgICBicmVhazsKICAgICAgfQogICAgfQogICAgY29uc3Qgcm93U3VtID0gcm93QXJlYXMucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCk7CiAgICBjb25zdCB0aGlja25lc3MgPSByb3dTdW0gLyBzaWRlOwogICAgaWYgKGN3ID49IGNoKSB7CiAgICAgIGxldCB5eSA9IGN5OwogICAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygcm93KSB7CiAgICAgICAgY29uc3QgaGggPSBpdGVtLmFyZWEgLyB0aGlja25lc3M7CiAgICAgICAgb3V0LnB1c2goeyB4OiBjeCwgeTogeXksIHc6IHRoaWNrbmVzcywgaDogaGgsIGRhdGE6IGl0ZW0uZGF0YSwgdmFsdWU6IGl0ZW0udmFsdWUgfSk7CiAgICAgICAgeXkgKz0gaGg7CiAgICAgIH0KICAgICAgY3ggKz0gdGhpY2tuZXNzOwogICAgICBjdyAtPSB0aGlja25lc3M7CiAgICB9IGVsc2UgewogICAgICBsZXQgeHggPSBjeDsKICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHJvdykgewogICAgICAgIGNvbnN0IHd3ID0gaXRlbS5hcmVhIC8gdGhpY2tuZXNzOwogICAgICAgIG91dC5wdXNoKHsgeDogeHgsIHk6IGN5LCB3OiB3dywgaDogdGhpY2tuZXNzLCBkYXRhOiBpdGVtLmRhdGEsIHZhbHVlOiBpdGVtLnZhbHVlIH0pOwogICAgICAgIHh4ICs9IHd3OwogICAgICB9CiAgICAgIGN5ICs9IHRoaWNrbmVzczsKICAgICAgY2ggLT0gdGhpY2tuZXNzOwogICAgfQogICAgcmVzdCA9IHJlc3Quc2xpY2Uocm93Lmxlbmd0aCk7CiAgfQogIHJldHVybiBvdXQ7Cn0K",
  "src/components/currency-toggle.tsx": "aW1wb3J0IHsgdXNlRWZmZWN0IH0gZnJvbSAicmVhY3QiOwppbXBvcnQgeyB1c2VDdXJyZW5jeSwgdHlwZSBQcmljZUN1cnJlbmN5IH0gZnJvbSAiQC9saWIvY3VycmVuY3kiOwoKY29uc3QgT1BUSU9OUzogeyB2YWx1ZTogUHJpY2VDdXJyZW5jeTsgbGFiZWw6IHN0cmluZyB9W10gPSBbCiAgeyB2YWx1ZTogIklOUiIsIGxhYmVsOiAi4oK5IiB9LAogIHsgdmFsdWU6ICJVU0QiLCBsYWJlbDogIiQiIH0sCl07CgpleHBvcnQgZnVuY3Rpb24gQ3VycmVuY3lUb2dnbGUoKSB7CiAgY29uc3QgY3VycmVuY3kgPSB1c2VDdXJyZW5jeSgoc3RhdGUpID0+IHN0YXRlLmN1cnJlbmN5KTsKICBjb25zdCBzZXRDdXJyZW5jeSA9IHVzZUN1cnJlbmN5KChzdGF0ZSkgPT4gc3RhdGUuc2V0Q3VycmVuY3kpOwogIGNvbnN0IGh5ZHJhdGUgPSB1c2VDdXJyZW5jeSgoc3RhdGUpID0+IHN0YXRlLmh5ZHJhdGUpOwoKICB1c2VFZmZlY3QoKCkgPT4gewogICAgaHlkcmF0ZSgpOwogIH0sIFtoeWRyYXRlXSk7CgogIHJldHVybiAoCiAgICA8ZGl2CiAgICAgIHJvbGU9Imdyb3VwIgogICAgICBhcmlhLWxhYmVsPSJQcmljZSBjdXJyZW5jeSIKICAgICAgY2xhc3NOYW1lPSJpbmxpbmUtZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgcm91bmRlZC1mdWxsIGJvcmRlciBib3JkZXItYm9yZGVyIGJnLXN1cmZhY2UgcC0xIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LWZnIgogICAgPgogICAgICA8c3BhbiBjbGFzc05hbWU9InB4LTIgdGV4dC1tdXRlZCI+UHJpY2VzPC9zcGFuPgogICAgICB7T1BUSU9OUy5tYXAoKG9wdGlvbikgPT4gKAogICAgICAgIDxidXR0b24KICAgICAgICAgIGtleT17b3B0aW9uLnZhbHVlfQogICAgICAgICAgdHlwZT0iYnV0dG9uIgogICAgICAgICAgYXJpYS1wcmVzc2VkPXtjdXJyZW5jeSA9PT0gb3B0aW9uLnZhbHVlfQogICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0Q3VycmVuY3kob3B0aW9uLnZhbHVlKX0KICAgICAgICAgIGNsYXNzTmFtZT17YG1pbi13LTggcm91bmRlZC1mdWxsIHB4LTIuNSBweS0xLjUgJHsKICAgICAgICAgICAgY3VycmVuY3kgPT09IG9wdGlvbi52YWx1ZSA/ICJiZy1wcmltYXJ5IHRleHQtb24tcHJpbWFyeSIgOiAidGV4dC1mZyIKICAgICAgICAgIH1gfQogICAgICAgID4KICAgICAgICAgIHtvcHRpb24ubGFiZWx9CiAgICAgICAgPC9idXR0b24+CiAgICAgICkpfQogICAgPC9kaXY+CiAgKTsKfQo=",
  "src/components/sector-heatmap.tsx": "aW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAicmVhY3QiOwppbXBvcnQgeyBmb3JtYXRNY2FwLCBmb3JtYXRQY3QsIGZvcm1hdFByaWNlIH0gZnJvbSAiQC9saWIvZm9ybWF0IjsKaW1wb3J0IHR5cGUgeyBTdG9ja1JvdyB9IGZyb20gIkAvbGliL3Jvd3MiOwppbXBvcnQgeyBzcXVhcmlmeSB9IGZyb20gIkAvbGliL3RyZWVtYXAiOwoKdHlwZSBTcGFuID0gImQxIiB8ICJkNyIgfCAiZDMwIjsKCmNvbnN0IFNQQU5TOiB7IGlkOiBTcGFuOyBsYWJlbDogc3RyaW5nIH1bXSA9IFsKICB7IGlkOiAiZDEiLCBsYWJlbDogIjI0aCIgfSwKICB7IGlkOiAiZDciLCBsYWJlbDogIjdkIiB9LAogIHsgaWQ6ICJkMzAiLCBsYWJlbDogIjMwZCIgfSwKXTsKCmNvbnN0IE1BWF9TVE9DS1MgPSAxNTA7CmNvbnN0IEhFQURFUiA9IDE2Owpjb25zdCBQQUQgPSAyOwoKZnVuY3Rpb24gY2hhbmdlT2Yocm93OiBTdG9ja1Jvdywgc3BhbjogU3Bhbik6IG51bWJlciB8IG51bGwgewogIGlmIChzcGFuID09PSAiZDciKSByZXR1cm4gcm93LnF1b3RlLmNoYW5nZTdkOwogIGlmIChzcGFuID09PSAiZDMwIikgcmV0dXJuIHJvdy5xdW90ZS5jaGFuZ2UzMGQ7CiAgcmV0dXJuIHJvdy5xdW90ZS5saXZlID8gcm93LnF1b3RlLmNoYW5nZVBjdCA6IG51bGw7Cn0KCmZ1bmN0aW9uIGNvbG9yT2YocGN0OiBudW1iZXIgfCBudWxsLCBzcGFuOiBTcGFuKTogc3RyaW5nIHsKICBpZiAocGN0ID09IG51bGwgfHwgIU51bWJlci5pc0Zpbml0ZShwY3QpKSByZXR1cm4gInJnYmEoMTI4LDEyOCwxNDAsMC4zNSkiOwogIGNvbnN0IHNjYWxlID0gc3BhbiA9PT0gImQxIiA/IDMgOiBzcGFuID09PSAiZDciID8gNiA6IDEyOwogIGNvbnN0IHQgPSBNYXRoLm1pbihNYXRoLmFicyhwY3QpIC8gc2NhbGUsIDEpOwogIGlmIChNYXRoLmFicyhwY3QpIDwgMC4wMDUpIHJldHVybiAicmdiYSgxMjgsMTI4LDE0MCwwLjQ1KSI7CiAgY29uc3QgYWxwaGEgPSAwLjMgKyAwLjYyICogdDsKICByZXR1cm4gcGN0ID4gMCA/IGByZ2JhKDIyLDE2Myw3NCwke2FscGhhfSlgIDogYHJnYmEoMjIwLDM4LDM4LCR7YWxwaGF9KWA7Cn0KCmV4cG9ydCBmdW5jdGlvbiBTZWN0b3JIZWF0bWFwKHsKICByb3dzLAogIG9uUGljaywKfTogewogIHJvd3M6IFN0b2NrUm93W107CiAgb25QaWNrOiAoc3ltYm9sOiBzdHJpbmcpID0+IHZvaWQ7Cn0pIHsKICBjb25zdCBib3hSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQgfCBudWxsPihudWxsKTsKICBjb25zdCBbd2lkdGgsIHNldFdpZHRoXSA9IHVzZVN0YXRlKDApOwogIGNvbnN0IFtzcGFuLCBzZXRTcGFuXSA9IHVzZVN0YXRlPFNwYW4+KCJkMSIpOwoKICB1c2VFZmZlY3QoKCkgPT4gewogICAgY29uc3QgZWwgPSBib3hSZWYuY3VycmVudDsKICAgIGlmICghZWwpIHJldHVybjsKICAgIHNldFdpZHRoKGVsLmNsaWVudFdpZHRoKTsKICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IFJlc2l6ZU9ic2VydmVyKCgpID0+IHNldFdpZHRoKGVsLmNsaWVudFdpZHRoKSk7CiAgICBvYnNlcnZlci5vYnNlcnZlKGVsKTsKICAgIHJldHVybiAoKSA9PiBvYnNlcnZlci5kaXNjb25uZWN0KCk7CiAgfSwgW10pOwoKICBjb25zdCBoZWlnaHQgPSB3aWR0aCA8IDY0MCA/IDU2MCA6IDUyMDsKCiAgY29uc3QgbGF5b3V0ID0gdXNlTWVtbygoKSA9PiB7CiAgICBpZiAod2lkdGggPD0gMCkgcmV0dXJuIFtdOwogICAgY29uc3QgdG9wID0gWy4uLnJvd3NdLnNvcnQoKGEsIGIpID0+IGIubWNhcCAtIGEubWNhcCkuc2xpY2UoMCwgTUFYX1NUT0NLUyk7CiAgICBjb25zdCBieVNlY3RvciA9IG5ldyBNYXA8c3RyaW5nLCBTdG9ja1Jvd1tdPigpOwogICAgZm9yIChjb25zdCByb3cgb2YgdG9wKSB7CiAgICAgIGNvbnN0IGxpc3QgPSBieVNlY3Rvci5nZXQocm93LnNlY3RvcikgPz8gW107CiAgICAgIGxpc3QucHVzaChyb3cpOwogICAgICBieVNlY3Rvci5zZXQocm93LnNlY3RvciwgbGlzdCk7CiAgICB9CiAgICBjb25zdCBzZWN0b3JzID0gWy4uLmJ5U2VjdG9yLmVudHJpZXMoKV0ubWFwKChbbmFtZSwgbGlzdF0pID0+ICh7CiAgICAgIHZhbHVlOiBsaXN0LnJlZHVjZSgoc3VtLCByb3cpID0+IHN1bSArIHJvdy5tY2FwLCAwKSwKICAgICAgZGF0YTogeyBuYW1lLCBsaXN0IH0sCiAgICB9KSk7CiAgICByZXR1cm4gc3F1YXJpZnkoc2VjdG9ycywgMCwgMCwgd2lkdGgsIGhlaWdodCkubWFwKChjZWxsKSA9PiAoewogICAgICBzZWN0b3I6IGNlbGwuZGF0YS5uYW1lLAogICAgICByZWN0OiBjZWxsLAogICAgICBzdG9ja3M6IHNxdWFyaWZ5KAogICAgICAgIGNlbGwuZGF0YS5saXN0Lm1hcCgocm93KSA9PiAoeyB2YWx1ZTogcm93Lm1jYXAsIGRhdGE6IHJvdyB9KSksCiAgICAgICAgY2VsbC54ICsgUEFELAogICAgICAgIGNlbGwueSArIEhFQURFUiwKICAgICAgICBjZWxsLncgLSBQQUQgKiAyLAogICAgICAgIGNlbGwuaCAtIEhFQURFUiAtIFBBRCwKICAgICAgKSwKICAgIH0pKTsKICB9LCBbcm93cywgd2lkdGgsIGhlaWdodF0pOwoKICByZXR1cm4gKAogICAgPHNlY3Rpb24gY2xhc3NOYW1lPSJtdC0zIiBhcmlhLWxhYmVsPSJTZWN0b3IgaGVhdG1hcCI+CiAgICAgIDxkaXYgY2xhc3NOYW1lPSJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0yIHBiLTIiPgogICAgICAgIDxwIGNsYXNzTmFtZT0idGV4dC14cyB0ZXh0LW11dGVkIj4KICAgICAgICAgIEJveCBzaXplID0gbWFya2V0IGNhcCDCtyBjb2xvdXIgPSB7U1BBTlMuZmluZCgocykgPT4gcy5pZCA9PT0gc3Bhbik/LmxhYmVsfSBjaGFuZ2UgwrcgdG9wIHtNYXRoLm1pbihyb3dzLmxlbmd0aCwgTUFYX1NUT0NLUyl9IHN0b2NrcwogICAgICAgIDwvcD4KICAgICAgICA8ZGl2IGNsYXNzTmFtZT0iZmxleCBnYXAtMSI+CiAgICAgICAgICB7U1BBTlMubWFwKChpdGVtKSA9PiAoCiAgICAgICAgICAgIDxidXR0b24KICAgICAgICAgICAgICBrZXk9e2l0ZW0uaWR9CiAgICAgICAgICAgICAgdHlwZT0iYnV0dG9uIgogICAgICAgICAgICAgIGFyaWEtcHJlc3NlZD17c3BhbiA9PT0gaXRlbS5pZH0KICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTcGFuKGl0ZW0uaWQpfQogICAgICAgICAgICAgIGNsYXNzTmFtZT17YG1pbi1oLTkgcm91bmRlZC1mdWxsIHB4LTMgdGV4dC14cyBmb250LXNlbWlib2xkICR7CiAgICAgICAgICAgICAgICBzcGFuID09PSBpdGVtLmlkID8gImJnLXByaW1hcnkgdGV4dC1vbi1wcmltYXJ5IiA6ICJiZy1zdWJ0bGUgdGV4dC1mZyIKICAgICAgICAgICAgICB9YH0KICAgICAgICAgICAgPgogICAgICAgICAgICAgIHtpdGVtLmxhYmVsfQogICAgICAgICAgICA8L2J1dHRvbj4KICAgICAgICAgICkpfQogICAgICAgIDwvZGl2PgogICAgICA8L2Rpdj4KICAgICAgPGRpdiByZWY9e2JveFJlZn0gY2xhc3NOYW1lPSJ3LWZ1bGwgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1ib3JkZXIgYmctc3VyZmFjZSIgc3R5bGU9e3sgaGVpZ2h0IH19PgogICAgICAgIHt3aWR0aCA+IDAgJiYgbGF5b3V0Lmxlbmd0aCA+IDAgPyAoCiAgICAgICAgICA8c3ZnIHdpZHRoPXt3aWR0aH0gaGVpZ2h0PXtoZWlnaHR9IHJvbGU9ImltZyIgYXJpYS1sYWJlbD0iTWFya2V0IGNhcCBoZWF0bWFwIGJ5IHNlY3RvciI+CiAgICAgICAgICAgIHtsYXlvdXQubWFwKCh7IHNlY3RvciwgcmVjdCwgc3RvY2tzIH0pID0+ICgKICAgICAgICAgICAgICA8ZyBrZXk9e3NlY3Rvcn0+CiAgICAgICAgICAgICAgICA8cmVjdCB4PXtyZWN0Lnh9IHk9e3JlY3QueX0gd2lkdGg9e3JlY3Qud30gaGVpZ2h0PXtyZWN0Lmh9IGZpbGw9InZhcigtLWNvbG9yLXN1YnRsZSkiIHN0cm9rZT0idmFyKC0tY29sb3ItYm9yZGVyKSIgLz4KICAgICAgICAgICAgICAgIHtyZWN0LncgPiA0NCA/ICgKICAgICAgICAgICAgICAgICAgPHRleHQgeD17cmVjdC54ICsgNn0geT17cmVjdC55ICsgMTJ9IGZvbnRTaXplPXsxMH0gZm9udFdlaWdodD17NzAwfSBmaWxsPSJ2YXIoLS1jb2xvci1tdXRlZCkiIHN0eWxlPXt7IHRleHRUcmFuc2Zvcm06ICJ1cHBlcmNhc2UiLCBsZXR0ZXJTcGFjaW5nOiAiMC4wNGVtIiB9fT4KICAgICAgICAgICAgICAgICAgICB7c2VjdG9yfQogICAgICAgICAgICAgICAgICA8L3RleHQ+CiAgICAgICAgICAgICAgICApIDogbnVsbH0KICAgICAgICAgICAgICAgIHtzdG9ja3MubWFwKChjZWxsKSA9PiB7CiAgICAgICAgICAgICAgICAgIGNvbnN0IHJvdyA9IGNlbGwuZGF0YTsKICAgICAgICAgICAgICAgICAgY29uc3QgcGN0ID0gY2hhbmdlT2Yocm93LCBzcGFuKTsKICAgICAgICAgICAgICAgICAgY29uc3QgbWluU2lkZSA9IE1hdGgubWluKGNlbGwudywgY2VsbC5oKTsKICAgICAgICAgICAgICAgICAgY29uc3Qgc2hvd1RleHQgPSBjZWxsLncgPiAzNCAmJiBjZWxsLmggPiAyMDsKICAgICAgICAgICAgICAgICAgY29uc3QgZm9udFNpemUgPSBNYXRoLm1heCg4LCBNYXRoLm1pbigxNiwgbWluU2lkZSAvIDMuMiwgKGNlbGwudyAtIDYpIC8gKHJvdy5zeW1ib2wubGVuZ3RoICogMC42MikpKTsKICAgICAgICAgICAgICAgICAgY29uc3Qgc2hvd1BjdCA9IHNob3dUZXh0ICYmIGNlbGwuaCA+IGZvbnRTaXplICogMi42ICYmIGNlbGwudyA+IDQwOwogICAgICAgICAgICAgICAgICBjb25zdCBjeCA9IGNlbGwueCArIGNlbGwudyAvIDI7CiAgICAgICAgICAgICAgICAgIGNvbnN0IGN5ID0gY2VsbC55ICsgY2VsbC5oIC8gMjsKICAgICAgICAgICAgICAgICAgcmV0dXJuICgKICAgICAgICAgICAgICAgICAgICA8ZyBrZXk9e3Jvdy5zeW1ib2x9IG9uQ2xpY2s9eygpID0+IG9uUGljayhyb3cuc3ltYm9sKX0gc3R5bGU9e3sgY3Vyc29yOiAicG9pbnRlciIgfX0+CiAgICAgICAgICAgICAgICAgICAgICA8dGl0bGU+CiAgICAgICAgICAgICAgICAgICAgICAgIHtgJHtyb3cubmFtZX0gKCR7cm93LnN5bWJvbH0pXG4ke2Zvcm1hdFByaWNlKHJvdy5xdW90ZS5wcmljZSl9IMK3ICR7Zm9ybWF0UGN0KHBjdCl9XG5Na3QgY2FwICR7Zm9ybWF0TWNhcChyb3cubWNhcCl9YH0KICAgICAgICAgICAgICAgICAgICAgIDwvdGl0bGU+CiAgICAgICAgICAgICAgICAgICAgICA8cmVjdAogICAgICAgICAgICAgICAgICAgICAgICB4PXtjZWxsLnh9CiAgICAgICAgICAgICAgICAgICAgICAgIHk9e2NlbGwueX0KICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg9e01hdGgubWF4KGNlbGwudyAtIDEsIDApfQogICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ9e01hdGgubWF4KGNlbGwuaCAtIDEsIDApfQogICAgICAgICAgICAgICAgICAgICAgICBmaWxsPXtjb2xvck9mKHBjdCwgc3Bhbil9CiAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZT0idmFyKC0tY29sb3ItYmcpIgogICAgICAgICAgICAgICAgICAgICAgICBzdHJva2VXaWR0aD17MX0KICAgICAgICAgICAgICAgICAgICAgICAgcng9ezJ9CiAgICAgICAgICAgICAgICAgICAgICAvPgogICAgICAgICAgICAgICAgICAgICAge3Nob3dUZXh0ID8gKAogICAgICAgICAgICAgICAgICAgICAgICA8dGV4dCB4PXtjeH0geT17c2hvd1BjdCA/IGN5IC0gMSA6IGN5ICsgZm9udFNpemUgLyAzfSB0ZXh0QW5jaG9yPSJtaWRkbGUiIGZvbnRTaXplPXtmb250U2l6ZX0gZm9udFdlaWdodD17NzAwfSBmaWxsPSJ2YXIoLS1jb2xvci1mZykiIHN0eWxlPXt7IHBvaW50ZXJFdmVudHM6ICJub25lIiB9fT4KICAgICAgICAgICAgICAgICAgICAgICAgICB7cm93LnN5bWJvbC5sZW5ndGggKiBmb250U2l6ZSAqIDAuNjIgPiBjZWxsLncgPyByb3cuc3ltYm9sLnNsaWNlKDAsIE1hdGgubWF4KDIsIE1hdGguZmxvb3IoY2VsbC53IC8gKGZvbnRTaXplICogMC42MikpKSkgOiByb3cuc3ltYm9sfQogICAgICAgICAgICAgICAgICAgICAgICA8L3RleHQ+CiAgICAgICAgICAgICAgICAgICAgICApIDogbnVsbH0KICAgICAgICAgICAgICAgICAgICAgIHtzaG93UGN0ID8gKAogICAgICAgICAgICAgICAgICAgICAgICA8dGV4dCB4PXtjeH0geT17Y3kgKyBmb250U2l6ZSArIDF9IHRleHRBbmNob3I9Im1pZGRsZSIgZm9udFNpemU9e01hdGgubWF4KDgsIGZvbnRTaXplIC0gMyl9IGZpbGw9InZhcigtLWNvbG9yLWZnKSIgc3R5bGU9e3sgcG9pbnRlckV2ZW50czogIm5vbmUiIH19PgogICAgICAgICAgICAgICAgICAgICAgICAgIHtmb3JtYXRQY3QocGN0KX0KICAgICAgICAgICAgICAgICAgICAgICAgPC90ZXh0PgogICAgICAgICAgICAgICAgICAgICAgKSA6IG51bGx9CiAgICAgICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICAgICAgICApOwogICAgICAgICAgICAgICAgfSl9CiAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICApKX0KICAgICAgICAgIDwvc3ZnPgogICAgICAgICkgOiAoCiAgICAgICAgICA8cCBjbGFzc05hbWU9InAtNiB0ZXh0LWNlbnRlciB0ZXh0LXNtIHRleHQtbXV0ZWQiPk5vIHN0b2NrcyB0byBzaG93LjwvcD4KICAgICAgICApfQogICAgICA8L2Rpdj4KICAgICAgPGRpdiBjbGFzc05hbWU9Im10LTIgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTIgdGV4dC14cyB0ZXh0LW11dGVkIj4KICAgICAgICA8c3Bhbj57c3BhbiA9PT0gImQxIiA/ICLiiJIzJSIgOiBzcGFuID09PSAiZDciID8gIuKIkjYlIiA6ICLiiJIxMiUifTwvc3Bhbj4KICAgICAgICA8c3BhbiBjbGFzc05hbWU9ImgtMiB3LTQwIHJvdW5kZWQtZnVsbCIgc3R5bGU9e3sgYmFja2dyb3VuZDogImxpbmVhci1ncmFkaWVudCg5MGRlZywgcmdiYSgyMjAsMzgsMzgsMC45MiksIHJnYmEoMTI4LDEyOCwxNDAsMC40NSksIHJnYmEoMjIsMTYzLDc0LDAuOTIpKSIgfX0gLz4KICAgICAgICA8c3Bhbj57c3BhbiA9PT0gImQxIiA/ICIrMyUiIDogc3BhbiA9PT0gImQ3IiA/ICIrNiUiIDogIisxMiUifTwvc3Bhbj4KICAgICAgPC9kaXY+CiAgICA8L3NlY3Rpb24+CiAgKTsKfQo="
};

/** Purani files mein badlav: [purana text, naya text]. */
const edits = {
  "src/lib/format.ts": [
    [
      "import type { ChartRange } from \"@/lib/market-types\";",
      "import type { ChartRange } from \"@/lib/market-types\";\nimport { useCurrency } from \"@/lib/currency\";"
    ],
    [
      "export type Tone =",
      "const usdFormat = new Intl.NumberFormat(\"en-US\", {\n  style: \"currency\",\n  currency: \"USD\",\n  minimumFractionDigits: 2,\n  maximumFractionDigits: 2,\n});\n\nconst usdSmallFormat = new Intl.NumberFormat(\"en-US\", {\n  style: \"currency\",\n  currency: \"USD\",\n  minimumFractionDigits: 4,\n  maximumFractionDigits: 4,\n});\n\nexport type Tone ="
    ],
    [
      "export function formatPrice(n: number): string {\n  return priceFormat.format(n);\n}",
      "export function formatPrice(n: number): string {\n  if (useCurrency.getState().currency === \"USD\") {\n    const usd = n / usdInr;\n    return (Math.abs(usd) < 1 ? usdSmallFormat : usdFormat).format(usd);\n  }\n  return priceFormat.format(n);\n}"
    ],
    [
      "export function formatAxis(n: number): string {\n  return n.toLocaleString(\"en-IN\", {\n    maximumFractionDigits: n >= 1000 ? 0 : 2,\n  });\n}",
      "export function formatAxis(n: number): string {\n  const usd = useCurrency.getState().currency === \"USD\";\n  const value = usd ? n / usdInr : n;\n  return value.toLocaleString(usd ? \"en-US\" : \"en-IN\", {\n    maximumFractionDigits: value >= 1000 ? 0 : 2,\n  });\n}"
    ]
  ],
  "src/components/market-board.tsx": [
    [
      "import { Sparkline } from \"@/components/sparkline\";",
      "import { Sparkline } from \"@/components/sparkline\";\nimport { CurrencyToggle } from \"@/components/currency-toggle\";\nimport { SectorHeatmap } from \"@/components/sector-heatmap\";\nimport { useCurrency } from \"@/lib/currency\";"
    ],
    [
      "  const navigate = useNavigate();\n  const symbols = useWatchlist",
      "  const navigate = useNavigate();\n  const priceCurrency = useCurrency((state) => state.currency);\n  const [layout, setLayout] = useState<\"table\" | \"map\">(\"table\");\n  const symbols = useWatchlist"
    ],
    [
      "prices in rupees",
      "prices in {priceCurrency === \"USD\" ? \"US dollars\" : \"rupees\"}"
    ],
    [
      "<span>As of {formatWhen(asOf)} IST</span>",
      "<CurrencyToggle />\n          <span>As of {formatWhen(asOf)} IST</span>"
    ],
    [
      "        <p className=\"text-sm text-muted\">\n          {filtered.length} of {rows.length}\n        </p>",
      "        <div className=\"flex items-center gap-3\">\n          <div className=\"flex gap-1 rounded-full bg-subtle p-1\">\n            {([\"table\", \"map\"] as const).map((mode) => (\n              <button\n                key={mode}\n                type=\"button\"\n                aria-pressed={layout === mode}\n                onClick={() => setLayout(mode)}\n                className={`min-h-9 rounded-full px-3 text-xs font-semibold ${\n                  layout === mode ? \"bg-primary text-on-primary\" : \"text-fg\"\n                }`}\n              >\n                {mode === \"table\" ? \"Table\" : \"Heatmap\"}\n              </button>\n            ))}\n          </div>\n          <p className=\"text-sm text-muted\">\n            {filtered.length} of {rows.length}\n          </p>\n        </div>"
    ],
    [
      "<div className=\"mt-3 overflow-x-clip rounded-xl border border-border\">",
      "{layout === \"map\" ? (\n        <SectorHeatmap\n          rows={filtered}\n          onPick={(symbol) => void navigate({ to: \"/stock/$symbol\", params: { symbol } })}\n        />\n      ) : null}\n\n      <div className={`mt-3 overflow-x-clip rounded-xl border border-border ${layout === \"map\" ? \"hidden\" : \"\"}`}>"
    ],
    [
      "{pageCount > 1 ? (",
      "{layout === \"table\" && pageCount > 1 ? ("
    ]
  ],
  "src/components/stock-detail.tsx": [
    [
      "import { SiteHeader } from \"@/components/site-header\";",
      "import { SiteHeader } from \"@/components/site-header\";\nimport { CurrencyToggle } from \"@/components/currency-toggle\";\nimport { useCurrency } from \"@/lib/currency\";"
    ],
    [
      "  const listing = LISTING_BY_SYMBOL[symbol];\n  const navigate = useNavigate();",
      "  const listing = LISTING_BY_SYMBOL[symbol];\n  const navigate = useNavigate();\n  useCurrency((state) => state.currency);"
    ],
    [
      "<div className=\"flex shrink-0 items-center gap-2\">",
      "<div className=\"flex shrink-0 items-center gap-2\">\n          <CurrencyToggle />"
    ]
  ]
};

if (existsSync("src/lib/currency.ts")) {
  console.log("Pehle se patch ho chuka hai.");
  process.exit(0);
}
if (!readFileSync("src/lib/format.ts", "utf8").includes("setUsdInr")) {
  console.error("Pehle patch-usd.mjs aur patch-live-usd.mjs chalao, phir ye script.");
  process.exit(1);
}

// Pehle sab check karo, taaki kuch adhura na badle.
const updated = {};
for (const [file, list] of Object.entries(edits)) {
  let text = readFileSync(file, "utf8");
  for (const [from, to] of list) {
    const count = text.split(from).length - 1;
    if (count !== 1) {
      console.error(`${file}: line ${count === 0 ? "nahi mili" : "kai baar mili"}, kuch nahi badla:\n${from}`);
      process.exit(1);
    }
    text = text.split(from).join(to);
  }
  updated[file] = text;
}

for (const [file, data] of Object.entries(newFiles)) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(data, "base64"));
}
for (const [file, text] of Object.entries(updated)) writeFileSync(file, text);
console.log("Done! Ab Prices ₹/$ toggle aur Heatmap button dono aa gaye.");
