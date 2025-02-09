import { describe, it, expect } from "vitest";
import { updateIds } from "../utils/updateIds";

describe("updateIds", () => {
  it("should replace id fields with new UUIDs", () => {
    const input = { id: "12345", name: "it", userId: "67890" };
    const output = updateIds(input);
    expect(output.id).not.toBe("12345");
    expect(output.userId).not.toBe("67890");
    expect(typeof output.id).toBe("string");
    expect(typeof output.userId).toBe("string");
  });

  it("should replace IDs inside nested objects", () => {
    const input = { user: { id: "abcde", profile: { accountId: "fghij" } } };
    const output = updateIds(input);
    expect(output.user.id).not.toBe("abcde");
    expect(output.user.profile.accountId).not.toBe("fghij");
  });

  it("should replace IDs inside arrays", () => {
    const input = { users: [{ id: "11111" }, { id: "22222" }] };
    const output = updateIds(input);
    expect(output.users[0].id).not.toBe("11111");
    expect(output.users[1].id).not.toBe("22222");
  });

  it("should replace IDs in strings", () => {
    const input = {
      id: "11111",
      message: "User 11111 has been assigned to 67890",
    };
    const output = updateIds(input);
    expect(output.message).not.toContain("12345");
    expect(output.message).toContain(output.id);
    expect(output.message).toContain("67890");
  });

  it("should leave non-ID fields unchanged", () => {
    const input = { name: "John Doe", age: 30 };
    const output = updateIds(input);
    expect(output.name).toBe("John Doe");
    expect(output.age).toBe(30);
  });
});
