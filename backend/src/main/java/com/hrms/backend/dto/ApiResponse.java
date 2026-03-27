package com.hrms.backend.dto;

import java.util.Map;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ApiResponse<T> {

    private final boolean success;
    private final String message;
    private final T data;
    private final Map<String, Object> meta;

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(String message, T data, Map<String, Object> meta) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .meta(meta)
                .build();
    }

    public static ApiResponse<Object> error(String message, Map<String, Object> meta) {
        return ApiResponse.builder()
                .success(false)
                .message(message)
                .meta(meta)
                .build();
    }
}
