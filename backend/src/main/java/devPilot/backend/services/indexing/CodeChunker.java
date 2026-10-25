package devPilot.backend.services.indexing;


import devPilot.backend.services.ai.RagSettings;
import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;


@Component
public class CodeChunker {
    private final TokenTextSplitter splitter;
    private final CodeFileFilter fileFilter;

    public CodeChunker(@Value("${app.indexing.chunk-size:800}") int chunkSize,
                       CodeFileFilter fileFilter) {
        int chunkTokens = Math.max(50, chunkSize / 4);
        this.splitter = TokenTextSplitter.builder()
                .withChunkSize(chunkTokens)
                .build();
        this.fileFilter = fileFilter;
    }

    public List<Document> chunkFile(String repoId, String filePath, String content) {
        if (content == null || content.isBlank()) {
            return List.of();
        }

        String language = fileFilter.detectLanguage(filePath);
        String header = "// File: " + filePath + "\n";

        Document source = new Document(header + content, baseMetadata(repoId, filePath, language));
        List<Document> split = splitter.apply(List.of(source));

        return IntStream.range(0, split.size())
                .mapToObj(i -> withChunkIndex(split.get(i), repoId, filePath, language, i, content))
                .toList();
    }


    private Map<String, Object> baseMetadata(String repoId, String filePath, String language) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put(RagSettings.METADATA_REPO_ID, repoId);
        metadata.put("filePath", filePath);
        metadata.put("language", language);
        return metadata;
    }

    private static Document withChunkIndex(
            Document chunk,
            String repoId,
            String filePath,
            String language,
            int chunkIndex,
            String originalContent) {
        Map<String, Object> metadata = new HashMap<>(chunk.getMetadata());
        metadata.put(RagSettings.METADATA_REPO_ID, repoId);
        metadata.put("filePath", filePath);
        metadata.put("language", language);
        metadata.put("chunkIndex", chunkIndex);
        int[] range = lineRange(originalContent, chunk.getText());
        if (range != null) {
            metadata.put("startLine", range[0]);
            metadata.put("endLine", range[1]);
        }
        return new Document(chunk.getText(), metadata);
    }

    private static int[] lineRange(String original, String chunkText) {
        if (original == null || chunkText == null) {
            return null;
        }
        String body = chunkText.replaceFirst("^// File: [^\\n]*\\n", "");
        if (body.isBlank()) {
            return null;
        }
        int index = original.indexOf(body);
        if (index < 0) {
            String[] lines = body.split("\n", 4);
            int take = Math.min(3, lines.length);
            String probe = String.join("\n", java.util.Arrays.copyOf(lines, take));
            index = original.indexOf(probe);
        }
        if (index < 0) {
            return null;
        }
        int startLine = 1;
        for (int i = 0; i < index; i++) {
            if (original.charAt(i) == '\n') {
                startLine++;
            }
        }
        int endLine = startLine;
        for (int i = 0; i < body.length(); i++) {
            if (body.charAt(i) == '\n') {
                endLine++;
            }
        }
        return new int[] {startLine, endLine};
    }
}