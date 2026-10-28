package devPilot.backend.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;





@RestControllerAdvice
public class GlobalExceptionHandler {


    @ExceptionHandler(UnauthorizedException.class)
    ResponseEntity<Map<String,Object>> handleUnauthorizedException(UnauthorizedException ex) {
        return error(HttpStatus.UNAUTHORIZED,ex.getMessage());
    }

    @ExceptionHandler(NotFoundException.class)
    ResponseEntity<Map<String,Object>> handleNotFoundException(NotFoundException ex) {
        return error(HttpStatus.NOT_FOUND,ex.getMessage());
    }

    @ExceptionHandler(BadRequestException.class)
    ResponseEntity<Map<String,Object>> handleBadRequestException(BadRequestException ex) {
        return error(HttpStatus.BAD_REQUEST,ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String,Object>> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .orElse("Validation Failed");
        return error(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Map<String,Object>> handleGenericException(Exception ex) {
        return error(HttpStatus.INTERNAL_SERVER_ERROR,ex.getMessage()!=null ? ex.getMessage() : "An unexpected error occurred");
    }

    /**
     * Handle exceptions during SSE streaming - send error as SSE event instead of JSON response
     * to avoid "No converter for text/event-stream" errors.
     */
    @ExceptionHandler({IOException.class, IllegalStateException.class})
    public void handleSseException(Exception ex, SseEmitter emitter) {
        try {
            emitter.send(SseEmitter.event()
                    .name("error")
                    .data(Map.of("message", "Stream interrupted: " + ex.getMessage()), MediaType.APPLICATION_JSON));
            emitter.completeWithError(ex);
        } catch (IOException ignored) {
            emitter.completeWithError(ex);
        }
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of(
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", message == null ? "" : message,
                "timestamp", Instant.now().toString()
        ));
    }
}