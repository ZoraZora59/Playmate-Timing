package utils

import (
	"testing"
	"time"

	"companion-platform-backend/models"
)

func TestHashAndCheckPassword(t *testing.T) {
	pw := "s3cret-pass"
	hash, err := HashPassword(pw)
	if err != nil {
		t.Fatalf("HashPassword error: %v", err)
	}
	if hash == pw {
		t.Fatal("password was not hashed")
	}
	if !CheckPassword(hash, pw) {
		t.Fatal("CheckPassword should accept the correct password")
	}
	if CheckPassword(hash, "wrong") {
		t.Fatal("CheckPassword should reject a wrong password")
	}
}

func TestGenerateAndParseToken(t *testing.T) {
	InitJWT("test-secret")
	u := &models.User{ID: 42, Username: "alice", Role: models.RoleProvider}

	tok, err := GenerateToken(u, time.Hour)
	if err != nil {
		t.Fatalf("GenerateToken error: %v", err)
	}

	claims, err := ParseToken(tok)
	if err != nil {
		t.Fatalf("ParseToken error: %v", err)
	}
	if claims.UserID != 42 || claims.Username != "alice" || claims.Role != models.RoleProvider {
		t.Fatalf("claims mismatch: %+v", claims)
	}
}

func TestParseTokenRejectsGarbage(t *testing.T) {
	InitJWT("test-secret")
	if _, err := ParseToken("not-a-real-token"); err == nil {
		t.Fatal("ParseToken should reject a malformed token")
	}
}

func TestParseTokenRejectsExpired(t *testing.T) {
	InitJWT("test-secret")
	u := &models.User{ID: 1, Username: "bob", Role: models.RolePlayer}
	tok, err := GenerateToken(u, -time.Hour) // already expired
	if err != nil {
		t.Fatalf("GenerateToken error: %v", err)
	}
	if _, err := ParseToken(tok); err == nil {
		t.Fatal("ParseToken should reject an expired token")
	}
}
