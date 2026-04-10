# Tracking Link API - QA Test Suite

**Advanced QA Engineer Implementation**

This repository contains a comprehensive test suite for validating tracking link generation, selection logic, and redirect performance for the NextWork tracking link API system.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Test Scenarios](#test-scenarios)
5. [Manual Testing Guide](#manual-testing-guide)
6. [Automated Testing](#automated-testing)
7. [CI/CD - Daily Automated Tests](#cicd---daily-automated-tests)
8. [Performance Metrics](#performance-metrics)
9. [Test Report](#test-report)

---

## 🎯 Overview

### Test Objectives

This QA suite verifies:
- ✅ **Correct tracking link selection** based on user country
- ✅ **Language-based matching** for internationalization
- ✅ **Default fallback behavior** when no specific match exists
- ✅ **Multi-attribute matching** (country + language + device)
- ✅ **Redirect performance** and latency measurement
- ✅ **Cross-browser compatibility**



---



mpm install to install all dependencies
npm run test to execute all tests
