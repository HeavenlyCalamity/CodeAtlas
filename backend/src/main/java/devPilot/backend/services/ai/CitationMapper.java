package devPilot.backend.services.ai;

import java.util.List;

import jakarta.persistence.Converts;
import org.springframework.ai.document.Document;
import org.springframework. stereotype.Component;

import tools.jackson. core. JacksonException;
import tools.jackson.core.type. TypeReference;
import tools. jackson. databind. json. JsonMapper;

import devPilot.backend.dto.CitationDto;
import lombok. RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class CitationMapper {

    private final JsonMapper jsonMapper;
    public CitationDto fromDocument(Document document) {
        var meta = document.getMetadata();
        return new CitationDto(
                stringVal(meta.get("filePath")),
                intVal(meta.get("startLine")),
                intVal(meta.get("endLine")),
                stringVal(meta.get("language")));

    }

    private String stringVal(Object filePath) {
        return filePath != null ? filePath.toString() : null;
    }

    private Integer intVal(Object line) {
        return line != null ? Integer.valueOf(line.toString()) : null;
    }

    public String toJson(List<CitationDto> citations) {
        try {
            return jsonMapper.writeValueAsString(citations);
        } catch (JacksonException e) {
            return "[]";
        }
    }
}