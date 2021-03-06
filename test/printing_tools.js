// This test can be run directly using mocha:
// $ npx mocha test/printingTools.js
// Using truffle test works but it's much slower, since it needs to compile contracts and deploy them to the blockchain.

const assert = require("assert")
const BN = require("bn.js")

const { toErc20Units, fromErc20Units } = require("../scripts/utils/printing_tools")
const { MAXUINT256, ONE } = require("../scripts/utils/constants")

const goodTwoWayPairs = [
  {
    user: "1.1",
    machine: "1100",
    decimals: 3,
  },
  {
    user: "0.01",
    machine: "100",
    decimals: 4,
  },
  {
    user: "1",
    machine: "100",
    decimals: 2,
  },
  {
    user: "104",
    machine: "104",
    decimals: 0,
  },
  {
    user: "0.002901",
    machine: "2901000000000000",
    decimals: 18,
  },
  {
    user: "1.002901",
    machine: "1002901000000000000",
    decimals: 18,
  },
  {
    user: "0." + MAXUINT256.toString().padStart(255, "0"),
    machine: MAXUINT256.toString(),
    decimals: 255,
  },
  {
    user: MAXUINT256.toString(),
    machine: MAXUINT256.toString(),
    decimals: 0,
  },
  {
    user: MAXUINT256.toString().slice(0, -18) + "." + MAXUINT256.toString().slice(-18),
    machine: MAXUINT256.toString(),
    decimals: 18,
  },
  {
    user: "0",
    machine: "0",
    decimals: 0,
  },
  {
    user: "0",
    machine: "0",
    decimals: 18,
  },
  {
    user: "0",
    machine: "0",
    decimals: 255,
  },
  {
    user: "11." + "".padEnd(30, "1"),
    machine: "".padEnd(32, "1"),
    decimals: 30,
  },
  {
    user: "0.0" + "".padEnd(29, "1"),
    machine: "".padEnd(29, "1"),
    decimals: 30,
  },
  {
    user: "".padEnd(30, "1"),
    machine: "".padEnd(30, "1"),
    decimals: 0,
  },
  {
    user: "222.222222222222222002",
    machine: "222222222222222222002",
    decimals: 18,
  },
]

const invalidDecimals = function (decimals) {
  return "Invalid number of decimals for ERC20 token: " + decimals.toString()
}
const tooLargeNumber = function () {
  return "Number larger than ERC20 token maximum amount (uint256)"
}
const invalidNumber = function (amount) {
  return "Failed to parse decimal representation of " + amount
}
const tooManyDecimals = function () {
  return "Too many decimals for the token in input string"
}
const invalidCharacter = function () {
  return "Invalid character"
}

// takes an integer and produces an array containing the same value expressed in all types accepted for "decimals"
const decimalTypesToTest = function (decimals) {
  return [decimals, decimals.toString(), new BN(decimals)]
}

describe("toErc20Units", () => {
  const testGoodEntries = function (entries) {
    for (const { user, machine, decimals } of entries) {
      decimalTypesToTest(decimals).map((_decimals) => {
        assert.equal(
          toErc20Units(user, _decimals).toString(),
          machine,
          "Fail for user string " + user + " with " + _decimals + " decimals"
        )
      })
    }
  }
  const testBadEntries = function (entries) {
    for (const { user, decimals, error } of entries) {
      let errorMessage
      switch (error) {
        case "invalidDecimals":
          errorMessage = invalidDecimals(decimals)
          break
        case "invalidNumber":
          errorMessage = invalidNumber(user)
          break
        case "tooManyDecimals":
          errorMessage = tooManyDecimals()
          break
        case "tooLargeNumber":
          errorMessage = tooLargeNumber()
          break
        default:
          throw Error("Invalid error to test")
      }
      decimalTypesToTest(decimals).map((_decimals) => {
        assert.throws(
          function () {
            return toErc20Units(user, _decimals)
          },
          Error(errorMessage),
          "Fail for user string " + user + " with " + decimals + " decimals"
        )
      })
    }
  }
  it("works as expected with reasonable input", () => {
    testGoodEntries(goodTwoWayPairs)
  })
  it("works as expected with atypical but correct input", () => {
    const strangeEntries = [
      {
        user: "0.0",
        machine: "0",
        decimals: 1,
      },
      {
        user: "0.0",
        machine: "0",
        decimals: 2,
      },
      {
        user: "0.210",
        machine: "2100",
        decimals: 4,
      },
      {
        user: "00.1",
        machine: "10",
        decimals: 2,
      },
      {
        user: "00.010",
        machine: "100",
        decimals: 4,
      },
      {
        user: "00100.00",
        machine: "10000",
        decimals: 2,
      },
      {
        user: "000000",
        machine: "0",
        decimals: 0,
      },
    ]
    testGoodEntries(strangeEntries)
  })
  it("fails with bad input", () => {
    const badEntries = [
      {
        user: "0",
        decimals: -1,
        error: "invalidDecimals",
      },
      {
        user: "0",
        decimals: 256,
        error: "invalidDecimals",
      },
      {
        user: "0",
        decimals: 1000,
        error: "invalidDecimals",
      },
      {
        user: "0,1",
        decimals: 18,
        error: "invalidNumber",
      },
      {
        user: "0.",
        decimals: 8,
        error: "invalidNumber",
      },
      {
        user: ".0",
        decimals: 2,
        error: "invalidNumber",
      },
      {
        user: "number",
        decimals: 10,
        error: "invalidNumber",
      },
      {
        user: "2..2",
        decimals: 42,
        error: "invalidNumber",
      },
      {
        user: "0x300",
        decimals: 200,
        error: "invalidNumber",
      },
      {
        user: "true",
        decimals: 1,
        error: "invalidNumber",
      },
      {
        user: "2+2",
        decimals: 81,
        error: "invalidNumber",
      },
      {
        user: "2.2.2",
        decimals: 12,
        error: "invalidNumber",
      },
      {
        user: "1e-1",
        decimals: 2,
        error: "invalidNumber",
      },
      {
        user: "1e1",
        decimals: 2,
        error: "invalidNumber",
      },
      {
        user: "1e+1",
        decimals: 2,
        error: "invalidNumber",
      },
      {
        user: "0.333",
        decimals: 2,
        error: "tooManyDecimals",
      },
      {
        user: "0.000",
        decimals: 2,
        error: "tooManyDecimals",
      },
      {
        user: "0.0",
        decimals: 0,
        error: "tooManyDecimals",
      },
      {
        user: "0." + "".padEnd(256, "0"),
        decimals: 255,
        error: "tooManyDecimals",
      },
      {
        user: MAXUINT256.add(ONE).toString(),
        decimals: 0,
        error: "tooLargeNumber",
      },
      {
        user: "0." + MAXUINT256.add(ONE).toString().padStart(255, "0"),
        decimals: 255,
        error: "tooLargeNumber",
      },
      {
        user: MAXUINT256.add(ONE).toString().slice(0, -18) + "." + MAXUINT256.add(ONE).toString().slice(-18),
        decimals: 18,
        error: "tooLargeNumber",
      },
    ]
    testBadEntries(badEntries)
  })
})

describe("fromErc20Units", () => {
  // takes an entry and produces an array containing the same entry expressed in all accepted input types
  const allTypesForEntry = function (entry) {
    const entriesToTest = []
    decimalTypesToTest(entry.decimals).map((decimals) => {
      entriesToTest.push({ user: entry.user, error: entry.error, decimals: decimals, machine: entry.machine })
      let machineToBn = null
      try {
        machineToBn = new BN(entry.machine)
      } catch (ignored) {
        // if the string cannot be made into a BN, then there is no need to test for this BN input
      } finally {
        if (machineToBn != null) {
          entriesToTest.push({ user: entry.user, error: entry.error, decimals: decimals, machine: machineToBn })
        }
      }
    })
    return entriesToTest
  }
  const testGoodEntries = function (entries) {
    for (const entry of entries) {
      allTypesForEntry(entry).map(({ machine, decimals, user }) => {
        assert.equal(
          fromErc20Units(machine, decimals),
          user,
          "Fail for machine string " + machine + " with " + decimals + " decimals"
        )
      })
    }
  }
  const testBadEntries = function (entries) {
    for (const entry of entries) {
      allTypesForEntry(entry).map(({ machine, decimals }) => {
        let errorMessage
        switch (entry.error) {
          case "invalidDecimals":
            errorMessage = invalidDecimals(decimals)
            break
          case "tooLargeNumber":
            errorMessage = tooLargeNumber()
            break
          case "invalidCharacter":
            errorMessage = invalidCharacter()
            break
          default:
            throw Error("Invalid error to test")
        }
        assert.throws(
          function () {
            return fromErc20Units(machine, decimals)
          },
          Error(errorMessage),
          "Fail for machine string " + machine + " with " + decimals + " decimals"
        )
      })
    }
  }
  it("works as expected with reasonable input", () => {
    testGoodEntries(goodTwoWayPairs)
  })
  it("works as expected with atypical but correct input", () => {
    const strangeEntries = [
      {
        machine: "000000",
        user: "0",
        decimals: 0,
      },
      {
        machine: "000000",
        user: "0",
        decimals: 18,
      },
      {
        machine: "000000",
        user: "0",
        decimals: 255,
      },
      {
        machine: "00000012",
        user: "12",
        decimals: 0,
      },
      {
        machine: "00000012",
        user: "0." + "".padEnd(16, "0") + "12",
        decimals: 18,
      },
      {
        machine: "00000012",
        user: "0." + "".padEnd(253, "0") + "12",
        decimals: 255,
      },
    ]
    testGoodEntries(strangeEntries)
  })
  it("fails with bad input", () => {
    const badEntries = [
      {
        machine: "0",
        decimals: -1,
        error: "invalidDecimals",
      },
      {
        machine: "0",
        decimals: 256,
        error: "invalidDecimals",
      },
      {
        machine: "0",
        decimals: 1000,
        error: "invalidDecimals",
      },
      {
        machine: MAXUINT256.add(ONE).toString(),
        decimals: 0,
        error: "tooLargeNumber",
      },
      {
        machine: MAXUINT256.add(ONE).toString(),
        decimals: 18,
        error: "tooLargeNumber",
      },
      {
        machine: MAXUINT256.add(ONE).toString(),
        decimals: 255,
        error: "tooLargeNumber",
      },
      {
        machine: "1e+1",
        decimals: 2,
        error: "invalidCharacter",
      },
      {
        machine: "1e1",
        decimals: 2,
        error: "invalidCharacter",
      },
      {
        machine: "1e-1",
        decimals: 2,
        error: "invalidCharacter",
      },
    ]
    testBadEntries(badEntries)
  })
})
