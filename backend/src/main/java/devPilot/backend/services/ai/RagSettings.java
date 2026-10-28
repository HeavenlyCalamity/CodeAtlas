package devPilot.backend.services.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class RagSettings {
    public static final String METADATA_REPO_ID = "repoId";

    private int topKChunks = 20;
    private long streamTimeoutMs = 180_000L;

    public RagSettings(@Value("${app.rag.top-k-chunks:20}") int topKChunks,
                       @Value("${app.rag.stream-timeout-ms:180000}") long streamTimeoutMs) {
        this.topKChunks = topKChunks;
        this.streamTimeoutMs = streamTimeoutMs;
    }

    public int getTopKChunks() {
        return topKChunks;
    }

    public long getStreamTimeoutMs() {
        return streamTimeoutMs;
    }
}
