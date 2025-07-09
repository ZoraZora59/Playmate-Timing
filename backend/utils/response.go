package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Response 统一响应格式
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// PageResponse 分页响应格式
type PageResponse struct {
	List     interface{} `json:"list"`
	Total    int64       `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"page_size"`
}

// Success 成功响应
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:    0,
		Message: "success",
		Data:    data,
	})
}

// SuccessWithMessage 带消息的成功响应
func SuccessWithMessage(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:    0,
		Message: message,
		Data:    data,
	})
}

// Error 错误响应
func Error(c *gin.Context, code int, message string) {
	c.JSON(http.StatusOK, Response{
		Code:    code,
		Message: message,
	})
}

// ErrorWithHTTPStatus 带HTTP状态码的错误响应
func ErrorWithHTTPStatus(c *gin.Context, httpStatus int, code int, message string) {
	c.JSON(httpStatus, Response{
		Code:    code,
		Message: message,
	})
}

// BadRequest 400错误
func BadRequest(c *gin.Context, message string) {
	ErrorWithHTTPStatus(c, http.StatusBadRequest, 400, message)
}

// Unauthorized 401错误
func Unauthorized(c *gin.Context, message string) {
	ErrorWithHTTPStatus(c, http.StatusUnauthorized, 401, message)
}

// Forbidden 403错误
func Forbidden(c *gin.Context, message string) {
	ErrorWithHTTPStatus(c, http.StatusForbidden, 403, message)
}

// NotFound 404错误
func NotFound(c *gin.Context, message string) {
	ErrorWithHTTPStatus(c, http.StatusNotFound, 404, message)
}

// InternalServerError 500错误
func InternalServerError(c *gin.Context, message string) {
	ErrorWithHTTPStatus(c, http.StatusInternalServerError, 500, message)
}

// PageSuccess 分页成功响应
func PageSuccess(c *gin.Context, list interface{}, total int64, page, pageSize int) {
	Success(c, PageResponse{
		List:     list,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}